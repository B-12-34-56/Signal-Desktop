"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var imageTagService_exports = {};
__export(imageTagService_exports, {
  ImageTagService: () => ImageTagService
});
module.exports = __toCommonJS(imageTagService_exports);
var import_client_rekognition = require("@aws-sdk/client-rekognition");
var import_imageHash = require("./imageHash");
var crypto = __toESM(require("crypto"));
class ImageTagService {
  static {
    __name(this, "ImageTagService");
  }
  // Time-to-live in milliseconds
  /**
   * Initialize the image tag service with AWS Rekognition configuration
   * @param config Configuration options for the service
   */
  constructor(config = {}) {
    this.region = config.region || "us-east-1";
    this.defaultBucket = config.defaultBucket || "signal-content-images";
    this.cacheTTL = (config.cacheTTL || 3600) * 1e3;
    this.rekognitionClient = new import_client_rekognition.RekognitionClient({
      region: this.region
      // Credentials will be loaded from environment variables
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    });
    this.cache = /* @__PURE__ */ new Map();
  }
  /**
   * Detect tags and labels in an image
   * @param options Options for tag detection
   * @returns Promise with tag detection response
   */
  async detectTags(options) {
    try {
      if (!options.imageData && !options.imageUrl && !options.s3Key) {
        throw new Error("Either imageData, imageUrl, or s3Key must be provided");
      }
      const minConfidence = options.minConfidence || 60;
      const maxLabels = options.maxLabels || 100;
      const detectModeration = options.detectModeration !== void 0 ? options.detectModeration : true;
      let imageHash;
      if (options.imageData) {
        imageHash = await (0, import_imageHash.getImageHash)(options.imageData);
      } else if (options.s3Key) {
        imageHash = crypto.createHash("sha256").update(options.s3Key).digest("hex");
      } else if (options.imageUrl) {
        imageHash = crypto.createHash("sha256").update(options.imageUrl).digest("hex");
      }
      if (imageHash) {
        const cacheResult = this.getCachedTags(imageHash);
        if (cacheResult) {
          return {
            success: true,
            tags: cacheResult,
            sourceHash: imageHash
          };
        }
      }
      const imageInput = this.prepareImageInput(options);
      const labelTags = await this.detectLabels(imageInput, minConfidence, maxLabels);
      let moderationTags = [];
      if (detectModeration) {
        moderationTags = await this.detectModerationLabels(imageInput, minConfidence);
      }
      const allTags = this.mergeTags([...labelTags, ...moderationTags]);
      if (imageHash) {
        this.cacheTags(imageHash, allTags);
      }
      return {
        success: true,
        tags: allTags,
        sourceHash: imageHash
      };
    } catch (error) {
      console.error("Error detecting image tags:", error);
      return {
        success: false,
        tags: [],
        error: error instanceof Error ? error.message : "Unknown error occurred during tag detection"
      };
    }
  }
  /**
   * Detect general labels in an image
   * @param imageInput Image input for Rekognition
   * @param minConfidence Minimum confidence threshold
   * @param maxLabels Maximum number of labels to return
   * @returns Promise with detected tags
   */
  async detectLabels(imageInput, minConfidence, maxLabels) {
    try {
      const params = {
        Image: imageInput,
        MinConfidence: minConfidence,
        MaxLabels: maxLabels
      };
      const command = new import_client_rekognition.DetectLabelsCommand(params);
      const response = await this.rekognitionClient.send(command);
      const tags = (response.Labels || []).map((label) => ({
        name: label.Name || "Unknown",
        confidence: label.Confidence || 0,
        parentNames: (label.Parents || []).map((parent) => parent.Name || ""),
        categories: label.Categories?.map((category) => category.Name || "") || []
      }));
      return tags;
    } catch (error) {
      console.error("Error detecting labels:", error);
      return [];
    }
  }
  /**
   * Detect moderation labels in an image
   * @param imageInput Image input for Rekognition
   * @param minConfidence Minimum confidence threshold
   * @returns Promise with detected moderation tags
   */
  async detectModerationLabels(imageInput, minConfidence) {
    try {
      const params = {
        Image: imageInput,
        MinConfidence: minConfidence
      };
      const command = new import_client_rekognition.DetectModerationLabelsCommand(params);
      const response = await this.rekognitionClient.send(command);
      const tags = (response.ModerationLabels || []).map((label) => ({
        name: label.Name || "Unknown",
        confidence: label.Confidence || 0,
        parentNames: label.ParentName ? [label.ParentName] : [],
        isModerationFlag: true
      }));
      return tags;
    } catch (error) {
      console.error("Error detecting moderation labels:", error);
      return [];
    }
  }
  /**
   * Prepare image input for Rekognition based on provided options
   * @param options Image tag options
   * @returns Formatted image input for Rekognition API
   */
  prepareImageInput(options) {
    if (options.imageData) {
      return {
        Bytes: options.imageData
      };
    }
    if (options.s3Key) {
      return {
        S3Object: {
          Bucket: options.s3Bucket || this.defaultBucket,
          Name: options.s3Key
        }
      };
    }
    if (options.imageUrl) {
      const urlParts = options.imageUrl.split("/");
      const key = urlParts[urlParts.length - 1];
      return {
        S3Object: {
          Bucket: this.defaultBucket,
          Name: key
        }
      };
    }
    throw new Error("Invalid image input options");
  }
  /**
   * Retrieve cached tags for an image hash
   * @param imageHash The hash of the image
   * @returns Array of tags if found in cache, null otherwise
   */
  getCachedTags(imageHash) {
    const cachedResult = this.cache.get(imageHash);
    if (!cachedResult) {
      return null;
    }
    const now = Date.now();
    if (now - cachedResult.timestamp > this.cacheTTL) {
      this.cache.delete(imageHash);
      return null;
    }
    return cachedResult.tags;
  }
  /**
   * Cache tags for an image hash
   * @param imageHash The hash of the image
   * @param tags Array of tags to cache
   */
  cacheTags(imageHash, tags) {
    this.cache.set(imageHash, {
      tags,
      timestamp: Date.now()
    });
    if (this.cache.size > 1e3) {
      this.cleanupCache();
    }
  }
  /**
   * Clean up old cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [hash, cachedResult] of this.cache.entries()) {
      if (now - cachedResult.timestamp > this.cacheTTL) {
        this.cache.delete(hash);
      }
    }
    if (this.cache.size > 800) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const entriesToRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < entriesToRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }
  /**
   * Merge and deduplicate tags
   * @param tagArrays Arrays of tags to merge
   * @returns Merged and deduplicated array of tags
   */
  mergeTags(tags) {
    const tagMap = /* @__PURE__ */ new Map();
    for (const tag of tags) {
      const existing = tagMap.get(tag.name.toLowerCase());
      if (!existing || tag.confidence > existing.confidence) {
        tagMap.set(tag.name.toLowerCase(), tag);
      } else if (existing && tag.confidence === existing.confidence) {
        existing.isModerationFlag = existing.isModerationFlag || tag.isModerationFlag;
        if (tag.parentNames) {
          existing.parentNames = [.../* @__PURE__ */ new Set([...existing.parentNames || [], ...tag.parentNames])];
        }
        if (tag.categories) {
          existing.categories = [.../* @__PURE__ */ new Set([...existing.categories || [], ...tag.categories])];
        }
      }
    }
    return Array.from(tagMap.values());
  }
  /**
   * Check if an image contains potentially unsafe content based on moderation tags
   * @param tags Array of image tags
   * @param threshold Confidence threshold for unsafe content
   * @returns Object indicating if image is unsafe with details
   */
  checkUnsafeContent(tags, threshold = 70) {
    const moderationTags = tags.filter((tag) => tag.isModerationFlag && tag.confidence >= threshold);
    const reasons = moderationTags.map((tag) => tag.name);
    const confidenceScores = moderationTags.reduce(
      (acc, tag) => {
        acc[tag.name] = tag.confidence;
        return acc;
      },
      {}
    );
    return {
      isUnsafe: moderationTags.length > 0,
      reasons,
      confidenceScores
    };
  }
  /**
   * Get tag categories from detected tags
   * @param tags Array of image tags
   * @param minConfidence Minimum confidence threshold
   * @returns Object with categorized tags
   */
  categorizeTags(tags, minConfidence = 60) {
    const filteredTags = tags.filter((tag) => tag.confidence >= minConfidence);
    const categorized = {
      moderation: [],
      objects: [],
      scenes: [],
      people: [],
      animals: [],
      other: []
    };
    for (const tag of filteredTags) {
      if (tag.isModerationFlag) {
        categorized.moderation.push(tag);
        continue;
      }
      const categories = tag.categories || [];
      const parentNames = tag.parentNames || [];
      const name = tag.name.toLowerCase();
      if (categories.some((c) => c.toLowerCase().includes("person")) || parentNames.some((p) => p.toLowerCase().includes("person")) || name.includes("person") || name.includes("face") || name.includes("human") || name.includes("people")) {
        categorized.people.push(tag);
      } else if (categories.some((c) => c.toLowerCase().includes("animal")) || parentNames.some((p) => p.toLowerCase().includes("animal")) || name.includes("animal") || name.includes("pet")) {
        categorized.animals.push(tag);
      } else if (categories.some((c) => c.toLowerCase().includes("scene")) || parentNames.some((p) => p.toLowerCase().includes("scene")) || name.includes("scene") || name.includes("landscape") || name.includes("outdoor") || name.includes("indoor")) {
        categorized.scenes.push(tag);
      } else if (!categories.some((c) => c.toLowerCase().includes("concept"))) {
        categorized.objects.push(tag);
      } else {
        categorized.other.push(tag);
      }
    }
    return categorized;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageTagService
});
