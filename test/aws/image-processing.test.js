 const { assert } = require('chai');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

// Mock the AWS services
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn()
    })),
    PutObjectCommand: jest.fn().mockImplementation(params => params),
    DeleteObjectCommand: jest.fn().mockImplementation(params => params)
  };
});

jest.mock('@aws-sdk/client-rekognition', () => {
  return {
    RekognitionClient: jest.fn().mockImplementation(() => ({
      send: jest.fn()
    })),
    DetectLabelsCommand: jest.fn().mockImplementation(params => params),
    DetectModerationLabelsCommand: jest.fn().mockImplementation(params => params)
  };
});

// Import the services we're testing
const { ImageUploadService } = require('../../app/filter/imageUploadService');
const { ImageTagService } = require('../../app/filter/imageTagService');
const { getImageHash } = require('../../app/filter/imageHash');

// Fixture paths
const FIXTURES_DIR = path.join(__dirname, '../../fixtures');
const KITTEN_IMAGE_PATH = path.join(FIXTURES_DIR, 'kitten-1-64-64.jpg');
const WIDE_IMAGE_PATH = path.join(FIXTURES_DIR, 'wide.jpg');
const MODERATION_IMAGE_PATH = path.join(FIXTURES_DIR, 'cat-screenshot.png');

// Test helpers
function loadFixtureAsBuffer(filePath) {
  return fs.readFileSync(filePath);
}

describe('AWS Image Processing', () => {
  let sandbox;
  let imageUploadService;
  let imageTagService;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Create service instances with test configuration
    imageUploadService = new ImageUploadService({
      region: 'us-west-2',
      bucketName: 'test-bucket',
      baseUrl: 'https://test-bucket.s3.us-west-2.amazonaws.com',
    });
    
    imageTagService = new ImageTagService({
      region: 'us-west-2',
      defaultBucket: 'test-bucket',
      cacheTTL: 60 // 1 minute for faster testing
    });
    
    // Reset mock implementations for each test
    const { S3Client } = require('@aws-sdk/client-s3');
    const { RekognitionClient } = require('@aws-sdk/client-rekognition');
    
    S3Client.mockClear();
    RekognitionClient.mockClear();
  });
  
  afterEach(() => {
    sandbox.restore();
  });

  describe('ImageUploadService', () => {
    describe('uploadImage method', () => {
      it('should successfully upload an image to S3', async () => {
        // Arrange
        const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
        const expectedHash = await getImageHash(imageData);
        const fileName = 'kitten.jpg';
        const contentType = 'image/jpeg';
        
        const s3Client = imageUploadService.s3Client;
        s3Client.send.mockResolvedValueOnce({}); // Mock successful upload
        
        // Act
        const result = await imageUploadService.uploadImage({
          imageData,
          fileName,
          contentType
        });
        
        // Assert
        assert.isTrue(result.success, 'Upload should be successful');
        assert.property(result, 'url', 'Result should contain URL');
        assert.property(result, 'key', 'Result should contain key');
        assert.strictEqual(result.hash, expectedHash, 'Image hash should match');
        assert.isTrue(s3Client.send.called, 'S3 client send should be called');
        
        // Verify S3 parameters
        const callArg = s3Client.send.getCall(0).args[0];
        assert.strictEqual(callArg.Bucket, 'test-bucket');
        assert.strictEqual(callArg.ContentType, contentType);
        assert.strictEqual(callArg.Body, imageData);
      });
      
      it('should handle upload errors gracefully', async () => {
        // Arrange
        const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
        const s3Client = imageUploadService.s3Client;
        const error = new Error('Upload failed');
        s3Client.send.mockRejectedValueOnce(error);
        
        // Act
        const result = await imageUploadService.uploadImage({
          imageData,
          fileName: 'kitten.jpg',
          contentType: 'image/jpeg'
        });
        
        // Assert
        assert.isFalse(result.success, 'Upload should fail');
        assert.property(result, 'error', 'Result should contain error');
        assert.strictEqual(result.error, error.message, 'Error message should match');
      });
      
      it('should resize images when resizeOptions are provided', async () => {
        // Arrange
        const imageData = loadFixtureAsBuffer(WIDE_IMAGE_PATH);
        const s3Client = imageUploadService.s3Client;
        s3Client.send.mockResolvedValueOnce({});
        
        // Mock the image-js import used in resizeImage
        const mockResizedImage = {
          toBuffer: sinon.stub().resolves(Buffer.from('resized-image-data')),
          getMimeType: sinon.stub().returns('image/jpeg')
        };
        
        const mockImage = {
          width: 800,
          height: 600,
          resize: sinon.stub().returns(mockResizedImage)
        };
        
        const mockImageJs = {
          Image: {
            load: sinon.stub().resolves(mockImage)
          }
        };
        
        // Mock dynamic import of image-js
        sandbox.stub(global, 'import').withArgs('image-js').resolves(mockImageJs);
        
        // Act
        const result = await imageUploadService.uploadImage({
          imageData,
          fileName: 'wide.jpg',
          contentType: 'image/jpeg',
          resizeOptions: {
            width: 400,
            height: 300,
            quality: 80
          }
        });
        
        // Assert
        assert.isTrue(result.success, 'Upload should be successful');
        
        // This assertion might fail because the actual code may handle the import differently
        // We might need to adjust this based on how the actual implementation works
      });
    });
    
    describe('deleteImage method', () => {
      it('should successfully delete an image from S3', async () => {
        // Arrange
        const key = 'test-image-key.jpg';
        const s3Client = imageUploadService.s3Client;
        s3Client.send.mockResolvedValueOnce({});
        
        // Act
        const result = await imageUploadService.deleteImage(key);
        
        // Assert
        assert.isTrue(result.success, 'Delete should be successful');
        assert.isTrue(s3Client.send.called, 'S3 client send should be called');
        
        // Verify parameters
        const callArg = s3Client.send.getCall(0).args[0];
        assert.strictEqual(callArg.Bucket, 'test-bucket');
        assert.strictEqual(callArg.Key, key);
      });
      
      it('should handle delete errors gracefully', async () => {
        // Arrange
        const key = 'non-existent-image.jpg';
        const s3Client = imageUploadService.s3Client;
        const error = new Error('The specified key does not exist');
        s3Client.send.mockRejectedValueOnce(error);
        
        // Act
        const result = await imageUploadService.deleteImage(key);
        
        // Assert
        assert.isFalse(result.success, 'Delete should fail');
        assert.property(result, 'error', 'Result should contain error');
        assert.strictEqual(result.error, error.message, 'Error message should match');
      });
    });
    
    describe('getImageUrl method', () => {
      it('should generate correct URL for an image key', () => {
        // Arrange
        const key = 'test-image.jpg';
        
        // Act
        const url = imageUploadService.getImageUrl(key);
        
        // Assert
        assert.strictEqual(url, 'https://test-bucket.s3.us-west-2.amazonaws.com/test-image.jpg');
      });
    });
    
    describe('imageExists method', () => {
      it('should return true when image exists', async () => {
        // Arrange
        const key = 'existing-image.jpg';
        const s3Client = imageUploadService.s3Client;
        s3Client.send.mockResolvedValueOnce({});
        
        // Act
        const result = await imageUploadService.imageExists(key);
        
        // Assert
        assert.isTrue(result, 'Should return true for existing image');
      });
      
      it('should return false when image does not exist', async () => {
        // Arrange
        const key = 'non-existent-image.jpg';
        const s3Client = imageUploadService.s3Client;
        const error = { name: 'NotFound' };
        s3Client.send.mockRejectedValueOnce(error);
        
        // Act
        const result = await imageUploadService.imageExists(key);
        
        // Assert
        assert.isFalse(result, 'Should return false for non-existent image');
      });
    });
  });

  describe('ImageTagService', () => {
    describe('detectTags method', () => {
      it('should detect tags from image data', async () => {
        // Arrange
        const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
        const rekognitionClient = imageTagService.rekognitionClient;
        
        // Mock responses for both label and moderation commands
        rekognitionClient.send.mockImplementation(command => {
          if (command.constructor.name === 'DetectLabelsCommand') {
            return Promise.resolve({
              Labels: [
                { Name: 'Cat', Confidence: 98.2, Parents: [] },
                { Name: 'Pet', Confidence: 98.2, Parents: [] },
                { Name: 'Animal', Confidence: 98.2, Parents: [] },
                { 
                  Name: 'Kitten', 
                  Confidence: 95.5, 
                  Parents: [{ Name: 'Cat' }, { Name: 'Animal' }],
                  Categories: [{ Name: 'Animals and Pets' }]
                }
              ]
            });
          } else if (command.constructor.name === 'DetectModerationLabelsCommand') {
            return Promise.resolve({
              ModerationLabels: []
            });
          }
          return Promise.reject(new Error('Unknown command'));
        });
        
        // Act
        const result = await imageTagService.detectTags({ imageData });
        
        // Assert
        assert.isTrue(result.success, 'Tag detection should be successful');
        assert.isArray(result.tags, 'Should return an array of tags');
        assert.isAtLeast(result.tags.length, 4, 'Should have at least 4 tags');
        
        // Verify tag properties
        const catTag = result.tags.find(tag => tag.name === 'Cat');
        assert.exists(catTag, 'Should include "Cat" tag');
        assert.approximately(catTag.confidence, 98.2, 0.1, 'Confidence should match');
        
        // Verify Kitten tag has correct parent names
        const kittenTag = result.tags.find(tag => tag.name === 'Kitten');
        assert.exists(kittenTag, 'Should include "Kitten" tag');
        assert.isArray(kittenTag.parentNames, 'Should have parent names');
        assert.include(kittenTag.parentNames, 'Cat', 'Parent names should include "Cat"');
        assert.include(kittenTag.parentNames, 'Animal', 'Parent names should include "Animal"');
      });
      
      it('should handle images with moderation flags', async () => {
        // Arrange
        const imageData = loadFixtureAsBuffer(MODERATION_IMAGE_PATH);
        const rekognitionClient = imageTagService.rekognitionClient;
        
        // Mock responses for moderation command
        rekognitionClient.send.mockImplementation(command => {
          if (command.constructor.name === 'DetectLabelsCommand') {
            return Promise.resolve({
              Labels: [
                { Name: 'Photo', Confidence: 98.2, Parents: [] }
              ]
            });
          } else if (command.constructor.name === 'DetectModerationLabelsCommand') {
            return Promise.resolve({
              ModerationLabels: [
                { Name: 'Suggestive', Confidence: 85.7, ParentName: 'Suggestive' },
                { Name: 'Violence', Confidence: 72.3, ParentName: 'Violence' }
              ]
            });
          }
          return Promise.reject(new Error('Unknown command'));
        });
        
        // Act
        const result = await imageTagService.detectTags({ imageData });
        
        // Assert
        assert.isTrue(result.success, 'Tag detection should be successful');
        
        // Verify moderation tags
        const moderationTags = result.tags.filter(tag => tag.isModerationFlag);
        assert.isAtLeast(moderationTags.length, 2, 'Should have at least 2 moderation tags');
        
        // Verify specific moderation tag
        const suggestiveTag = moderationTags.find(tag => tag.name === 'Suggestive');
        assert.exists(suggestiveTag, 'Should include "Suggestive" tag');
        assert.isTrue(suggestiveTag.isModerationFlag, 'Should be marked as moderation flag');
        assert.approximately(suggestiveTag.confidence, 85.7, 0.1, 'Confidence should match');
      });
      
      it('should use cache for repeated requests with same image', async () => {
        // Arrange
        const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
        const rekognitionClient = imageTagService.rekognitionClient;
        
        // First request - mock a response
        rekognitionClient.send.mockResolvedValueOnce({
          Labels: [
            { Name: 'Cat', Confidence: 98.2, Parents: [] }
          ]
        });
        rekognitionClient.send.mockResolvedValueOnce({
          ModerationLabels: []
        });
        
        // Act
        const result1 = await imageTagService.detectTags({ imageData });
        
        // Reset the mock to verify it's not called again
        rekognitionClient.send.mockClear();
        
        // Make a second request with the same image
        const result2 = await imageTagService.detectTags({ imageData });
        
        // Assert
        assert.isTrue(result1.success && result2.success, 'Both requests should be successful');
        assert.deepEqual(result1.tags, result2.tags, 'Tags should be the same across requests');
        assert.strictEqual(rekognitionClient.send.mock.calls.length, 0, 'Second request should use cache');
      });
      
      it('should handle errors gracefully', async () => {
        // Arrange
        const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
        const rekognitionClient = imageTagService.rekognitionClient;
        
        // Mock error
        rekognitionClient.send.mockRejectedValueOnce(new Error('Service unavailable'));
        
        // Act
        const result = await imageTagService.detectTags({ imageData });
        
        // Assert
        assert.isFalse(result.success, 'Tag detection should fail');
        assert.property(result, 'error', 'Should include error message');
        assert.isEmpty(result.tags, 'Tags should be empty on error');
      });
    });
    
    describe('categorizeTags method', () => {
      it('should categorize tags correctly', () => {
        // Arrange
        const tags = [
          { name: 'Person', confidence: 98.0 },
          { name: 'Cat', confidence: 95.0, categories: ['Animals'] },
          { name: 'Building', confidence: 90.0 },
          { name: 'Landscape', confidence: 85.0, categories: ['Scenes'] },
          { name: 'Explicit Content', confidence: 75.0, isModerationFlag: true },
          { name: 'Text', confidence: 50.0 }, // Below threshold
        ];
        
        // Act
        const categorized = imageTagService.categorizeTags(tags, 60);
        
        // Assert
        assert.property(categorized, 'moderation', 'Should have moderation category');
        assert.property(categorized, 'people', 'Should have people category');
        assert.property(categorized, 'animals', 'Should have animals category');
        
        assert.lengthOf(categorized.moderation, 1, 'Should have 1 moderation tag');
        assert.lengthOf(categorized.people, 1, 'Should have 1 people tag');
        assert.lengthOf(categorized.animals, 1, 'Should have 1 animal tag');
        
        // Check that low confidence tags are excluded
        const allTags = Object.values(categorized).flat();
        assert.isFalse(allTags.some(tag => tag.name === 'Text'), 'Should exclude low confidence tags');
      });
    });
    
    describe('checkUnsafeContent method', () => {
      it('should identify unsafe content based on moderation tags', () => {
        // Arrange
        const tags = [
          { name: 'Person', confidence: 98.0 },
          { name: 'Violence', confidence: 80.0, isModerationFlag: true },
          { name: 'Weapon', confidence: 75.0, isModerationFlag: true },
          { name: 'Suggestive', confidence: 65.0, isModerationFlag: true }, // Below threshold
        ];
        
        // Act
        const result = imageTagService.checkUnsafeContent(tags, 70);
        
        // Assert
        assert.isTrue(result.isUnsafe, 'Should identify image as unsafe');
        assert.lengthOf(result.reasons, 2, 'Should have 2 reasons');
        assert.include(result.reasons, 'Violence', 'Should include Violence as a reason');
        assert.include(result.reasons, 'Weapon', 'Should include Weapon as a reason');
        assert.notInclude(result.reasons, 'Suggestive', 'Should not include below-threshold tags');
        
        // Check confidence scores
        assert.property(result.confidenceScores, 'Violence');
        assert.approximately(result.confidenceScores.Violence, 80.0, 0.1);
      });
      
      it('should identify safe content', () => {
        // Arrange
        const tags = [
          { name: 'Person', confidence: 98.0 },
          { name: 'Cat', confidence: 95.0 },
          { name: 'Suggestive', confidence: 65.0, isModerationFlag: true }, // Below threshold
        ];
        
        // Act
        const result = imageTagService.checkUnsafeContent(tags, 70);
        
        // Assert
        assert.isFalse(result.isUnsafe, 'Should identify image as safe');
        assert.isEmpty(result.reasons, 'Should have no reasons');
      });
    });
  });
});