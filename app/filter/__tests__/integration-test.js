const { assert } = require('chai');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const awsMock = require('aws-sdk-mock');
const mockResponses = require('./mock-aws-responses');

// Import the services we're testing
const { ImageUploadService } = require('../../app/filter/imageUploadService');
const { ImageTagService } = require('../../app/filter/imageTagService');
const { FilterService } = require('../../app/filter/FilterService');
const { getImageHash } = require('../../app/filter/imageHash');

// Fixture paths
const FIXTURES_DIR = path.join(__dirname, '../../fixtures');
const KITTEN_IMAGE_PATH = path.join(FIXTURES_DIR, 'kitten-1-64-64.jpg');
const WIDE_IMAGE_PATH = path.join(FIXTURES_DIR, 'wide.jpg');
const CAT_SCREENSHOT_PATH = path.join(FIXTURES_DIR, 'cat-screenshot.png');
const LARGE_IMAGE_PATH = path.join(FIXTURES_DIR, 'tina-rolf-269345-unsplash.jpg');

// Helper to load test images
function loadFixtureAsBuffer(filePath) {
  return fs.readFileSync(filePath);
}

// Mock window.Signal.Data methods
global.window = {
  Signal: {
    Data: {
      getFilterSettings: sinon.stub().resolves({ 
        isEnabled: true, 
        isGlobalEnabled: true,
        similarityThreshold: 90,
        tagFilterThreshold: 70
      }),
      getContentHashes: sinon.stub().resolves([]),
      saveContentHash: sinon.stub().resolves(),
      getContentHashByHash: sinon.stub().resolves(null)
    }
  },
  textsecure: {
    storage: {
      user: {
        getDeviceId: sinon.stub().returns('device-id-1'),
        getNumber: sinon.stub().returns('user-id-1')
      }
    }
  }
};

describe('Filter System Integration Tests', () => {
  let sandbox;
  let imageUploadService;
  let imageTagService;
  let filterService;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Set up mocks for AWS services
    awsMock.mock('S3', 'upload', (params, callback) => {
      callback(null, mockResponses.s3UploadSuccessResponse);
    });
    
    awsMock.mock('S3', 'deleteObject', (params, callback) => {
      callback(null, mockResponses.s3DeleteSuccessResponse);
    });
    
    awsMock.mock('Rekognition', 'detectLabels', (params, callback) => {
      // Determine which mock response to use based on the image content
      if (params.Image && params.Image.Bytes) {
        const imageBuffer = Buffer.from(params.Image.Bytes);
        // Use image size as a simple way to differentiate test images
        if (imageBuffer.length < 10000) {
          callback(null, mockResponses.rekognitionDetectLabelsResponses.animals);
        } else if (imageBuffer.length < 50000) {
          callback(null, mockResponses.rekognitionDetectLabelsResponses.basic);
        } else {
          callback(null, mockResponses.rekognitionDetectLabelsResponses.nature);
        }
      } else if (params.Image && params.Image.S3Object) {
        // Check S3 object key to determine response
        if (params.Image.S3Object.Name.includes('kitten')) {
          callback(null, mockResponses.rekognitionDetectLabelsResponses.animals);
        } else if (params.Image.S3Object.Name.includes('wide')) {
          callback(null, mockResponses.rekognitionDetectLabelsResponses.nature);
        } else {
          callback(null, mockResponses.rekognitionDetectLabelsResponses.basic);
        }
      } else {
        callback(new Error('Invalid image input'));
      }
    });
    
    awsMock.mock('Rekognition', 'detectModerationLabels', (params, callback) => {
      // Return different moderation responses based on the image
      if (params.Image && params.Image.Bytes) {
        const imageBuffer = Buffer.from(params.Image.Bytes);
        if (imageBuffer.length > 100000) {
          callback(null, mockResponses.rekognitionDetectModerationLabelsResponses.violence);
        } else {
          callback(null, mockResponses.rekognitionDetectModerationLabelsResponses.clean);
        }
      } else if (params.Image && params.Image.S3Object) {
        if (params.Image.S3Object.Name.includes('screenshot')) {
          callback(null, mockResponses.rekognitionDetectModerationLabelsResponses.suggestive);
        } else {
          callback(null, mockResponses.rekognitionDetectModerationLabelsResponses.clean);
        }
      } else {
        callback(null, mockResponses.rekognitionDetectModerationLabelsResponses.clean);
      }
    });
    
    // Create service instances
    imageUploadService = new ImageUploadService({
      region: 'us-west-2',
      bucketName: 'test-bucket',
    });
    
    imageTagService = new ImageTagService({
      region: 'us-west-2',
      defaultBucket: 'test-bucket',
    });
    
    filterService = new FilterService();
    // Replace the services with our test instances
    filterService.imageUploadService = imageUploadService;
    filterService.imageTagService = imageTagService;
    
    // Reset stubs
    global.window.Signal.Data.getContentHashes.reset();
    global.window.Signal.Data.saveContentHash.reset();
  });
  
  afterEach(() => {
    sandbox.restore();
    awsMock.restore();
  });

  describe('Complete Filter Pipeline Integration', () => {
    it('should process a safe image through the full pipeline', async () => {
      // Arrange
      const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
      const attachment = {
        data: imageData,
        fileName: 'kitten.jpg',
        contentType: 'image/jpeg'
      };
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert
      assert.isTrue(result, 'Safe image should be allowed');
      assert.isTrue(global.window.Signal.Data.saveContentHash.calledOnce, 
        'Content hash should be saved');
      
      // Verify the saved hash contains the expected data
      const savedHashData = global.window.Signal.Data.saveContentHash.getCall(0).args[0];
      assert.equal(savedHashData.contentType, 'image', 'Content type should be image');
      assert.isArray(savedHashData.tags, 'Tags should be included');
      assert.isNotEmpty(savedHashData.tags, 'Tags array should not be empty');
    });
    
    it('should block images that contain moderation flags above threshold', async () => {
      // Arrange
      const imageData = loadFixtureAsBuffer(LARGE_IMAGE_PATH);
      const attachment = {
        data: imageData,
        fileName: 'large_image.jpg',
        contentType: 'image/jpeg'
      };
      
      // Override the mock to return moderation flags
      awsMock.remock('Rekognition', 'detectModerationLabels', (params, callback) => {
        callback(null, mockResponses.rekognitionDetectModerationLabelsResponses.explicit);
      });
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert
      assert.isFalse(result, 'Image with moderation flags should be blocked');
      assert.isFalse(global.window.Signal.Data.saveContentHash.called, 
        'Content hash should not be saved for blocked content');
    });
    
    it('should allow similar but not identical images', async () => {
      // Arrange
      const kitten1Data = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
      const kitten2Data = loadFixtureAsBuffer(path.join(FIXTURES_DIR, 'kitten-2-64-64.jpg'));
      
      // Configure mock to return previous hashes that are similar but not identical
      const kitten1Hash = await getImageHash(kitten1Data);
      global.window.Signal.Data.getContentHashes.resolves([{
        hash: kitten1Hash,
        contentType: 'image',
        timestamp: Date.now() - 1000
      }]);
      
      const attachment = {
        data: kitten2Data,
        fileName: 'kitten2.jpg',
        contentType: 'image/jpeg'
      };
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert
      // Result depends on the actual similarity between test images
      // Here we assume they are different enough to pass the filter
      assert.isTrue(result, 'Similar but not identical images should be allowed');
    });
    
    it('should handle large images without crashing', async () => {
      // Arrange
      const largeImageData = loadFixtureAsBuffer(LARGE_IMAGE_PATH);
      const attachment = {
        data: largeImageData,
        fileName: 'large_nature_photo.jpg',
        contentType: 'image/jpeg'
      };
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert
      assert.isTrue(global.window.Signal.Data.saveContentHash.called, 
        'Large image should be processed and saved');
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    it('should handle AWS service errors gracefully', async () => {
      // Arrange
      const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
      const attachment = {
        data: imageData,
        fileName: 'kitten.jpg',
        contentType: 'image/jpeg'
      };
      
      // Mock S3 to throw an error
      awsMock.remock('S3', 'upload', (params, callback) => {
        callback(new Error('Connection timeout'));
      });
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert
      assert.isFalse(result, 'Should handle S3 errors and reject the upload');
    });
    
    it('should handle malformed image data', async () => {
      // Arrange
      // Create a buffer with random data that's not a valid image
      const invalidImageData = Buffer.from('not a valid image file');
      const attachment = {
        data: invalidImageData,
        fileName: 'invalid.jpg',
        contentType: 'image/jpeg'
      };
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert - should still allow the image rather than crash
      assert.isTrue(result, 'Should handle invalid image data gracefully');
    });
    
    it('should work correctly when filter is disabled', async () => {
      // Arrange
      const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
      const attachment = {
        data: imageData,
        fileName: 'kitten.jpg',
        contentType: 'image/jpeg'
      };
      
      // Override filter settings to be disabled
      global.window.Signal.Data.getFilterSettings.resolves({
        isEnabled: false,
        isGlobalEnabled: false
      });
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert
      assert.isTrue(result, 'Should allow all images when filter is disabled');
      assert.isFalse(global.window.Signal.Data.saveContentHash.called, 
        'Should not save content hash when filter is disabled');
    });
    
    it('should not crash when database operations fail', async () => {
      // Arrange
      const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
      const attachment = {
        data: imageData,
        fileName: 'kitten.jpg',
        contentType: 'image/jpeg'
      };
      
      // Make the database operation fail
      global.window.Signal.Data.saveContentHash.rejects(new Error('Database error'));
      
      // Act
      const result = await filterService.handleImageAttachment(attachment);
      
      // Assert
      assert.isTrue(result, 'Should complete successfully despite database errors');
    });
  });
  
  describe('Tag Categorization and Filtering', () => {
    it('should properly categorize detected tags', async () => {
      // Arrange
      const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
      
      // Act
      const tags = await filterService.handleImageTags(imageData);
      const categorized = imageTagService.categorizeTags(tags);
      
      // Assert
      assert.isObject(categorized, 'Should return categorized tags object');
      assert.property(categorized, 'animals', 'Should have animals category');
      assert.isNotEmpty(categorized.animals, 'Animals category should have entries');
      
      // Check that the cat tag is in the animals category
      const catTagInAnimals = categorized.animals.some(tag => 
        tag.name.toLowerCase() === 'cat'
      );
      assert.isTrue(catTagInAnimals, 'Cat tag should be in animals category');
    });
    
    it('should filter out tags with low confidence scores', async () => {
      // Arrange
      // Create tags with various confidence levels
      const tags = [
        { name: 'High Confidence', confidence: 95.0 },
        { name: 'Medium Confidence', confidence: 75.0 },
        { name: 'Low Confidence', confidence: 40.0 },
        { name: 'Very Low Confidence', confidence: 20.0 }
      ];
      
      // Act
      const categorized = imageTagService.categorizeTags(tags, 60);  // 60% threshold
      const allCategorizedTags = Object.values(categorized).flat();
      
      // Assert
      assert.isArray(allCategorizedTags, 'Should return array of categorized tags');
      assert.lengthOf(allCategorizedTags, 2, 'Should only include tags above threshold');
      
      const tagNames = allCategorizedTags.map(tag => tag.name);
      assert.include(tagNames, 'High Confidence', 'Should include high confidence tag');
      assert.include(tagNames, 'Medium Confidence', 'Should include medium confidence tag');
      assert.notInclude(tagNames, 'Low Confidence', 'Should exclude low confidence tag');
      assert.notInclude(tagNames, 'Very Low Confidence', 'Should exclude very low confidence tag');
    });
  });
  
  describe('Integration with FilterService', () => {
    it('should use cached image tags when processing the same image multiple times', async () => {
      // Arrange
      const imageData = loadFixtureAsBuffer(KITTEN_IMAGE_PATH);
      
      // Act
      // Call handleImageTags multiple times with the same image
      const tags1 = await imageTagService.detectTags({ imageData });
      
      // Spy on the rekognition client send method after first call
      const detectTagsSpy = sandbox.spy(imageTagService.rekognitionClient, 'send');
      
      const tags2 = await imageTagService.detectTags({ imageData });
      
      // Assert
      assert.isTrue(tags1.success && tags2.success, 'Both calls should succeed');
      assert.deepEqual(tags1.tags, tags2.tags, 'Tags should be identical');
      assert.isFalse(detectTagsSpy.called, 'Should use cached tags on second call');
    });
    
    it('should clear cache when it gets too large', async () => {
      // Create a new ImageTagService with a tiny cache size for testing
      const tinyCache = new ImageTagService({
        region: 'us-west-2',
        cacheTTL: 1 // 1 second TTL
      });
      
      // Add many items to cache manually
      for (let i = 0; i < 1050; i++) {
        const mockHash = `mock-hash-${i}`;
        tinyCache.cache.set(mockHash, { 
          tags: [{ name: `Tag ${i}`, confidence: 95 }],
          timestamp: Date.now()
        });
      }
      
      // Trigger cache cleanup by accessing the private method
      tinyCache.cleanupCache();
      
      // Assert cache was cleaned up
      assert.isAtMost(tinyCache.cache.size, 850, 'Cache should be reduced in size');
    });
    
    it('should load settings from the data store', async () => {
      // Arrange
      const customSettings = {
        isEnabled: true,
        isGlobalEnabled: false,
        similarityThreshold: 80,
        tagFilterThreshold: 65
      };
      
      global.window.Signal.Data.getFilterSettings.resolves(customSettings);
      
      // Act
      const newFilterService = new FilterService();
      await newFilterService.loadSettings();
      
      // Assert
      assert.equal(newFilterService.isEnabled, customSettings.isEnabled, 
        'isEnabled should match settings');
      assert.equal(newFilterService.isGlobalEnabled, customSettings.isGlobalEnabled,
        'isGlobalEnabled should match settings');
      assert.equal(newFilterService.similarityThreshold, customSettings.similarityThreshold,
        'similarityThreshold should match settings');
      assert.equal(newFilterService.tagFilterThreshold, customSettings.tagFilterThreshold,
        'tagFilterThreshold should match settings');
    });
  });
});