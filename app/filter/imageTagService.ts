import { RekognitionClient, DetectLabelsCommand, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition"
import { getImageHash } from "./imageHash"
import * as crypto from "crypto"

// Define interfaces for parameters and responses
export interface ImageTagOptions {
  imageData?: Buffer
  imageUrl?: string
  s3Key?: string
  s3Bucket?: string
  minConfidence?: number
  maxLabels?: number
  detectModeration?: boolean
}

export interface ImageTag {
  name: string
  confidence: number
  parentNames?: string[]
  categories?: string[]
  isModerationFlag?: boolean
}

export interface ImageTagResponse {
  success: boolean
  tags: ImageTag[]
  sourceHash?: string
  error?: string
}

interface CachedTagResult {
  tags: ImageTag[]
  timestamp: number
}

export class ImageTagService {
  private rekognitionClient: RekognitionClient
  private region: string
  private defaultBucket: string
  private cache: Map<string, CachedTagResult>
  private cacheTTL: number // Time-to-live in milliseconds
  
  /**
   * Initialize the image tag service with AWS Rekognition configuration
   * @param config Configuration options for the service
   */
  constructor(config: {
    region?: string
    defaultBucket?: string
    cacheTTL?: number // in seconds
  } = {}) {
    this.region = config.region || "us-east-1"
    this.defaultBucket = config.defaultBucket || "signal-content-images"
    this.cacheTTL = (config.cacheTTL || 3600) * 1000 // Convert to milliseconds
    
    this.rekognitionClient = new RekognitionClient({ 
      region: this.region,
      // Credentials will be loaded from environment variables
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    })
    
    // Initialize cache
    this.cache = new Map<string, CachedTagResult>()
  }

  /**
   * Detect tags and labels in an image
   * @param options Options for tag detection
   * @returns Promise with tag detection response
   */
  public async detectTags(options: ImageTagOptions): Promise<ImageTagResponse> {
    try {
      // Validate input
      if (!options.imageData && !options.imageUrl && !options.s3Key) {
        throw new Error("Either imageData, imageUrl, or s3Key must be provided")
      }
      
      // Set defaults
      const minConfidence = options.minConfidence || 60 // Default to 60% confidence
      const maxLabels = options.maxLabels || 100
      const detectModeration = options.detectModeration !== undefined ? options.detectModeration : true
      
      // Generate or retrieve hash for cache lookup
      let imageHash: string | undefined
      
      if (options.imageData) {
        imageHash = await getImageHash(options.imageData)
      } else if (options.s3Key) {
        // Use s3Key as part of the cache key
        imageHash = crypto
          .createHash("sha256")
          .update(options.s3Key)
          .digest("hex")
      } else if (options.imageUrl) {
        // Use URL as part of the cache key
        imageHash = crypto
          .createHash("sha256")
          .update(options.imageUrl)
          .digest("hex")
      }
      
      // Check cache if we have a hash
      if (imageHash) {
        const cacheResult = this.getCachedTags(imageHash)
        if (cacheResult) {
          return {
            success: true,
            tags: cacheResult,
            sourceHash: imageHash
          }
        }
      }
      
      // Prepare image input for Rekognition
      const imageInput = this.prepareImageInput(options)
      
      // Detect general labels
      const labelTags = await this.detectLabels(imageInput, minConfidence, maxLabels)
      
      // Detect moderation labels if requested
      let moderationTags: ImageTag[] = []
      if (detectModeration) {
        moderationTags = await this.detectModerationLabels(imageInput, minConfidence)
      }
      
      // Combine and deduplicate tags
      const allTags = this.mergeTags([...labelTags, ...moderationTags])
      
      // Cache the results if we have a hash
      if (imageHash) {
        this.cacheTags(imageHash, allTags)
      }
      
      return {
        success: true,
        tags: allTags,
        sourceHash: imageHash
      }
    } catch (error) {
      console.error("Error detecting image tags:", error)
      return {
        success: false,
        tags: [],
        error: error instanceof Error ? error.message : "Unknown error occurred during tag detection"
      }
    }
  }

  /**
   * Detect general labels in an image
   * @param imageInput Image input for Rekognition
   * @param minConfidence Minimum confidence threshold
   * @param maxLabels Maximum number of labels to return
   * @returns Promise with detected tags
   */
  private async detectLabels(
    imageInput: Record<string, any>,
    minConfidence: number,
    maxLabels: number
  ): Promise<ImageTag[]> {
    try {
      const params = {
        Image: imageInput,
        MinConfidence: minConfidence,
        MaxLabels: maxLabels
      }
      
      const command = new DetectLabelsCommand(params)
      const response = await this.rekognitionClient.send(command)
      
      // Transform Rekognition labels to our ImageTag format
      const tags: ImageTag[] = (response.Labels || []).map(label => ({
        name: label.Name || "Unknown",
        confidence: label.Confidence || 0,
        parentNames: (label.Parents || []).map(parent => parent.Name || ""),
        categories: label.Categories?.map(category => category.Name || "") || []
      }))
      
      return tags
    } catch (error) {
      console.error("Error detecting labels:", error)
      return []
    }
  }

  /**
   * Detect moderation labels in an image
   * @param imageInput Image input for Rekognition
   * @param minConfidence Minimum confidence threshold
   * @returns Promise with detected moderation tags
   */
  private async detectModerationLabels(
    imageInput: Record<string, any>,
    minConfidence: number
  ): Promise<ImageTag[]> {
    try {
      const params = {
        Image: imageInput,
        MinConfidence: minConfidence
      }
      
      const command = new DetectModerationLabelsCommand(params)
      const response = await this.rekognitionClient.send(command)
      
      // Transform Rekognition moderation labels to our ImageTag format
      const tags: ImageTag[] = (response.ModerationLabels || []).map(label => ({
        name: label.Name || "Unknown",
        confidence: label.Confidence || 0,
        parentNames: label.ParentName ? [label.ParentName] : [],
        isModerationFlag: true
      }))
      
      return tags
    } catch (error) {
      console.error("Error detecting moderation labels:", error)
      return []
    }
  }

  /**
   * Prepare image input for Rekognition based on provided options
   * @param options Image tag options
   * @returns Formatted image input for Rekognition API
   */
  private prepareImageInput(options: ImageTagOptions): Record<string, any> {
    if (options.imageData) {
      return {
        Bytes: options.imageData
      }
    }
    
    if (options.s3Key) {
      return {
        S3Object: {
          Bucket: options.s3Bucket || this.defaultBucket,
          Name: options.s3Key
        }
      }
    }
    
    if (options.imageUrl) {
      // For external URLs, we would need to download the image first
      // This is a simplified approach assuming the URL is already in S3
      const urlParts = options.imageUrl.split("/")
      const key = urlParts[urlParts.length - 1]
      
      return {
        S3Object: {
          Bucket: this.defaultBucket,
          Name: key
        }
      }
    }
    
    throw new Error("Invalid image input options")
  }

  /**
   * Retrieve cached tags for an image hash
   * @param imageHash The hash of the image
   * @returns Array of tags if found in cache, null otherwise
   */
  private getCachedTags(imageHash: string): ImageTag[] | null {
    const cachedResult = this.cache.get(imageHash)
    
    if (!cachedResult) {
      return null
    }
    
    // Check if cache has expired
    const now = Date.now()
    if (now - cachedResult.timestamp > this.cacheTTL) {
      this.cache.delete(imageHash)
      return null
    }
    
    return cachedResult.tags
  }

  /**
   * Cache tags for an image hash
   * @param imageHash The hash of the image
   * @param tags Array of tags to cache
   */
  private cacheTags(imageHash: string, tags: ImageTag[]): void {
    this.cache.set(imageHash, {
      tags,
      timestamp: Date.now()
    })
    
    // Cleanup old cache entries if cache is getting too large
    if (this.cache.size > 1000) {
      this.cleanupCache()
    }
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    
    // Delete expired entries
    for (const [hash, cachedResult] of this.cache.entries()) {
      if (now - cachedResult.timestamp > this.cacheTTL) {
        this.cache.delete(hash)
      }
    }
    
    // If still too large, remove oldest entries
    if (this.cache.size > 800) { // Keep some buffer below max size
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // Remove oldest 20% of entries
      const entriesToRemove = Math.floor(entries.length * 0.2)
      for (let i = 0; i < entriesToRemove; i++) {
        this.cache.delete(entries[i][0])
      }
    }
  }

  /**
   * Merge and deduplicate tags
   * @param tagArrays Arrays of tags to merge
   * @returns Merged and deduplicated array of tags
   */
  private mergeTags(tags: ImageTag[]): ImageTag[] {
    // Group by name and take highest confidence
    const tagMap = new Map<string, ImageTag>()
    
    for (const tag of tags) {
      const existing = tagMap.get(tag.name.toLowerCase())
      
      if (!existing || tag.confidence > existing.confidence) {
        tagMap.set(tag.name.toLowerCase(), tag)
      } else if (existing && tag.confidence === existing.confidence) {
        // Merge properties if same confidence
        existing.isModerationFlag = existing.isModerationFlag || tag.isModerationFlag
        
        if (tag.parentNames) {
          existing.parentNames = [...new Set([...(existing.parentNames || []), ...tag.parentNames])]
        }
        
        if (tag.categories) {
          existing.categories = [...new Set([...(existing.categories || []), ...tag.categories])]
        }
      }
    }
    
    return Array.from(tagMap.values())
  }

  /**
   * Check if an image contains potentially unsafe content based on moderation tags
   * @param tags Array of image tags
   * @param threshold Confidence threshold for unsafe content
   * @returns Object indicating if image is unsafe with details
   */
  public checkUnsafeContent(
    tags: ImageTag[],
    threshold: number = 70
  ): { isUnsafe: boolean; reasons: string[]; confidenceScores: Record<string, number> } {
    const moderationTags = tags.filter(tag => tag.isModerationFlag && tag.confidence >= threshold)
    
    const reasons = moderationTags.map(tag => tag.name)
    const confidenceScores = moderationTags.reduce(
      (acc, tag) => {
        acc[tag.name] = tag.confidence
        return acc
      },
      {} as Record<string, number>
    )
    
    return {
      isUnsafe: moderationTags.length > 0,
      reasons,
      confidenceScores
    }
  }

  /**
   * Get tag categories from detected tags
   * @param tags Array of image tags
   * @param minConfidence Minimum confidence threshold
   * @returns Object with categorized tags
   */
  public categorizeTags(
    tags: ImageTag[],
    minConfidence: number = 60
  ): Record<string, ImageTag[]> {
    // Filter by minimum confidence
    const filteredTags = tags.filter(tag => tag.confidence >= minConfidence)
    
    // Group tags by categories
    const categorized: Record<string, ImageTag[]> = {
      moderation: [],
      objects: [],
      scenes: [],
      people: [],
      animals: [],
      other: []
    }
    
    for (const tag of filteredTags) {
      if (tag.isModerationFlag) {
        categorized.moderation.push(tag)
        continue
      }
      
      // Determine category based on parent names and categories
      const categories = tag.categories || []
      const parentNames = tag.parentNames || []
      const name = tag.name.toLowerCase()
      
      if (
        categories.some(c => c.toLowerCase().includes("person")) ||
        parentNames.some(p => p.toLowerCase().includes("person")) ||
        name.includes("person") ||
        name.includes("face") ||
        name.includes("human") ||
        name.includes("people")
      ) {
        categorized.people.push(tag)
      } else if (
        categories.some(c => c.toLowerCase().includes("animal")) ||
        parentNames.some(p => p.toLowerCase().includes("animal")) ||
        name.includes("animal") ||
        name.includes("pet")
      ) {
        categorized.animals.push(tag)
      } else if (
        categories.some(c => c.toLowerCase().includes("scene")) ||
        parentNames.some(p => p.toLowerCase().includes("scene")) ||
        name.includes("scene") ||
        name.includes("landscape") ||
        name.includes("outdoor") ||
        name.includes("indoor")
      ) {
        categorized.scenes.push(tag)
      } else if (
        !categories.some(c => c.toLowerCase().includes("concept"))
      ) {
        categorized.objects.push(tag)
      } else {
        categorized.other.push(tag)
      }
    }
    
    return categorized
  }
}