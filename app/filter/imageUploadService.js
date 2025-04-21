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
var imageUploadService_exports = {};
__export(imageUploadService_exports, {
  ImageUploadService: () => ImageUploadService
});
module.exports = __toCommonJS(imageUploadService_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_imageHash = require("./imageHash");
var crypto = __toESM(require("crypto"));
class ImageUploadService {
  static {
    __name(this, "ImageUploadService");
  }
  /**
   * Initialize the image upload service with AWS S3 configuration
   * @param config Configuration options for the service
   */
  constructor(config = {}) {
    this.region = config.region || "us-east-1";
    this.bucketName = config.bucketName || "signal-content-images";
    this.baseUrl = config.baseUrl || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    this.s3Client = new import_client_s3.S3Client({
      region: this.region
      // Credentials will be loaded from environment variables
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    });
  }
  /**
   * Upload an image to S3
   * @param options Upload options including image data and metadata
   * @returns Promise with upload response
   */
  async uploadImage(options) {
    try {
      const { imageData, fileName, contentType, metadata = {} } = options;
      const imageHash = await (0, import_imageHash.getImageHash)(imageData);
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString("hex");
      const key = `${timestamp}-${randomId}-${imageHash.substring(0, 10)}-${fileName}`;
      let processedImageData = imageData;
      if (options.resizeOptions) {
        processedImageData = await this.resizeImage(imageData, options.resizeOptions);
      }
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: processedImageData,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          imageHash,
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      await this.s3Client.send(new import_client_s3.PutObjectCommand(params));
      const url = `${this.baseUrl}/${key}`;
      return {
        success: true,
        url,
        key,
        hash: imageHash
      };
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during upload"
      };
    }
  }
  /**
   * Delete an image from S3 by key
   * @param key The S3 object key to delete
   * @returns Promise with delete operation result
   */
  async deleteImage(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };
      await this.s3Client.send(new import_client_s3.DeleteObjectCommand(params));
      return { success: true };
    } catch (error) {
      console.error("Error deleting image from S3:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during deletion"
      };
    }
  }
  /**
   * Resize an image based on options
   * @param imageData The original image buffer
   * @param options Resize options
   * @returns Promise with resized image buffer
   */
  async resizeImage(imageData, options) {
    try {
      const { Image } = await import("image-js");
      const image = await Image.load(imageData);
      const width = options.width || image.width;
      const height = options.height || image.height;
      const resizedImage = image.resize({ width, height });
      const quality = options.quality || 90;
      const mimeType = image.getMimeType() || "image/jpeg";
      return Buffer.from(await resizedImage.toBuffer({ mimeType, quality: quality / 100 }));
    } catch (error) {
      console.error("Error resizing image:", error);
      return imageData;
    }
  }
  /**
   * Get the URL for an uploaded image by key
   * @param key The S3 object key
   * @returns The complete URL to the image
   */
  getImageUrl(key) {
    return `${this.baseUrl}/${key}`;
  }
  /**
   * Check if an image exists by key
   * @param key The S3 object key to check
   * @returns Promise with boolean indicating if image exists
   */
  async imageExists(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };
      const headParams = {
        ...params,
        Range: "bytes=0-0"
      };
      await this.s3Client.send(new import_client_s3.PutObjectCommand(headParams));
      return true;
    } catch (error) {
      if (error?.name === "NotFound") {
        return false;
      }
      console.error("Error checking if image exists:", error);
      return false;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageUploadService
});
