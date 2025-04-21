import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getImageHash } from "./imageHash"
import * as crypto from "crypto"

// Define interfaces for parameters and responses
export interface ImageUploadOptions {
  imageData: Buffer
  fileName: string
  contentType: string
  metadata?: Record<string, string>
  resizeOptions?: {
    width?: number
    height?: number
    quality?: number
  }
}

export interface ImageUploadResponse {
  success: boolean
  url?: string
  key?: string
  hash?: string
  error?: string
}

export class ImageUploadService {
  private s3Client: S3Client
  private bucketName: string
  private region: string
  private baseUrl: string
  
  /**
   * Initialize the image upload service with AWS S3 configuration
   * @param config Configuration options for the service
   */
  constructor(config: {
    region?: string
    bucketName?: string
    baseUrl?: string
  } = {}) {
    this.region = config.region || "us-east-1"
    this.bucketName = config.bucketName || "signal-content-images"
    this.baseUrl = config.baseUrl || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`
    
    this.s3Client = new S3Client({ 
      region: this.region,
      // Credentials will be loaded from environment variables
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    })
  }

  /**
   * Upload an image to S3
   * @param options Upload options including image data and metadata
   * @returns Promise with upload response
   */
  public async uploadImage(options: ImageUploadOptions): Promise<ImageUploadResponse> {
    try {
      const { imageData, fileName, contentType, metadata = {} } = options
      
      // Generate a hash for the image to use as part of the key
      const imageHash = await getImageHash(imageData)
      
      // Create a unique key for the image
      const timestamp = Date.now()
      const randomId = crypto.randomBytes(8).toString("hex")
      const key = `${timestamp}-${randomId}-${imageHash.substring(0, 10)}-${fileName}`
      
      // Process image for different formats and sizes if needed
      let processedImageData = imageData
      if (options.resizeOptions) {
        processedImageData = await this.resizeImage(imageData, options.resizeOptions)
      }

      // Upload to S3
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: processedImageData,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          imageHash,
          uploadedAt: new Date().toISOString(),
        },
      }

      await this.s3Client.send(new PutObjectCommand(params))

      // Return success with URL to the uploaded image
      const url = `${this.baseUrl}/${key}`
      
      return {
        success: true,
        url,
        key,
        hash: imageHash,
      }
    } catch (error) {
      console.error("Error uploading image to S3:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during upload",
      }
    }
  }

  /**
   * Delete an image from S3 by key
   * @param key The S3 object key to delete
   * @returns Promise with delete operation result
   */
  public async deleteImage(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      }

      await this.s3Client.send(new DeleteObjectCommand(params))
      
      return { success: true }
    } catch (error) {
      console.error("Error deleting image from S3:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during deletion",
      }
    }
  }

  /**
   * Resize an image based on options
   * @param imageData The original image buffer
   * @param options Resize options
   * @returns Promise with resized image buffer
   */
  private async resizeImage(
    imageData: Buffer,
    options: { width?: number; height?: number; quality?: number }
  ): Promise<Buffer> {
    try {
      // Using image-js library since it's already used for image hashing
      const { Image } = await import("image-js")
      const image = await Image.load(imageData)
      
      // Calculate new dimensions if needed
      const width = options.width || image.width
      const height = options.height || image.height
      
      // Resize the image
      const resizedImage = image.resize({ width, height })
      
      // Get buffer with specified quality
      const quality = options.quality || 90
      const mimeType = image.getMimeType() || "image/jpeg"
      
      return Buffer.from(await resizedImage.toBuffer({ mimeType, quality: quality / 100 }))
    } catch (error) {
      console.error("Error resizing image:", error)
      // Return original image if resize fails
      return imageData
    }
  }

  /**
   * Get the URL for an uploaded image by key
   * @param key The S3 object key
   * @returns The complete URL to the image
   */
  public getImageUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }

  /**
   * Check if an image exists by key
   * @param key The S3 object key to check
   * @returns Promise with boolean indicating if image exists
   */
  public async imageExists(key: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      }

      // Using HeadObject command would be preferable here, but we'll simulate it
      // with a range request of 0 bytes to check existence
      const headParams = {
        ...params,
        Range: "bytes=0-0",
      }
      
      await this.s3Client.send(new PutObjectCommand(headParams))
      return true
    } catch (error) {
      // If error code is 404, the object doesn't exist
      if ((error as any)?.name === "NotFound") {
        return false
      }
      
      // For other errors, log but treat as non-existent to be safe
      console.error("Error checking if image exists:", error)
      return false
    }
  }
}