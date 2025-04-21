/**
 * Mock AWS responses for testing
 * This file provides mock responses for AWS S3 and Rekognition services
 * to use in unit tests without requiring actual AWS API calls.
 */

/**
 * @typedef {Object} S3UploadSuccessResponse
 * @property {string} ETag - Entity tag for the uploaded object
 * @property {string} VersionId - Version ID of the object (if versioning enabled)
 * @property {string} Location - URL of the uploaded object
 * @property {string} Key - Object key in the bucket
 * @property {string} Bucket - Name of the bucket
 */

/**
 * @typedef {Object} S3UploadErrorResponse
 * @property {string} message - Error message
 * @property {string} code - Error code
 * @property {number} statusCode - HTTP status code
 * @property {string} requestId - Request ID for debugging
 */

/**
 * @typedef {Object} RekognitionDetectLabelsResponse
 * @property {Array<Object>} Labels - Array of detected labels
 * @property {string} OrientationCorrection - Orientation correction if applied
 */

/**
 * @typedef {Object} RekognitionDetectModerationLabelsResponse
 * @property {Array<Object>} ModerationLabels - Array of detected moderation labels
 * @property {string} ModerationModelVersion - Version of the moderation model used
 */

/**
 * S3 Success Responses
 */
const s3UploadSuccessResponse = {
  ETag: '"e868e0f4719e394144ef36531ee6824c"',
  VersionId: 'v1',
  Location: 'https://test-bucket.s3.amazonaws.com/test-image.jpg',
  Key: 'test-image.jpg',
  Bucket: 'test-bucket'
};

const s3DeleteSuccessResponse = {};

/**
 * S3 Error Responses
 */
const s3UploadErrorResponses = {
  accessDenied: {
    message: 'Access Denied',
    code: 'AccessDenied',
    statusCode: 403,
    requestId: 'EXAMPLE123456789'
  },
  noSuchBucket: {
    message: 'The specified bucket does not exist',
    code: 'NoSuchBucket',
    statusCode: 404,
    requestId: 'EXAMPLE123456789'
  },
  entityTooLarge: {
    message: 'Your proposed upload exceeds the maximum allowed size',
    code: 'EntityTooLarge',
    statusCode: 400,
    requestId: 'EXAMPLE123456789'
  },
  throttling: {
    message: 'Rate exceeded',
    code: 'Throttling',
    statusCode: 400,
    requestId: 'EXAMPLE123456789'
  },
  internalError: {
    message: 'We encountered an internal error. Please try again.',
    code: 'InternalError',
    statusCode: 500,
    requestId: 'EXAMPLE123456789'
  }
};

const s3NotFoundResponse = {
  message: 'The specified key does not exist',
  code: 'NotFound',
  statusCode: 404,
  requestId: 'EXAMPLE123456789'
};

/**
 * Rekognition Label Detection Responses
 */
const rekognitionDetectLabelsResponses = {
  // Basic response with common objects
  basic: {
    Labels: [
      {
        Name: 'Person',
        Confidence: 98.4,
        Instances: [
          {
            BoundingBox: {
              Width: 0.4,
              Height: 0.8,
              Left: 0.3,
              Top: 0.1
            },
            Confidence: 98.4
          }
        ],
        Parents: []
      },
      {
        Name: 'Phone',
        Confidence: 95.2,
        Instances: [],
        Parents: [
          { Name: 'Electronics' }
        ]
      },
      {
        Name: 'Electronics',
        Confidence: 95.2,
        Instances: [],
        Parents: []
      }
    ],
    OrientationCorrection: 'ROTATE_0'
  },

  // Response with nature elements
  nature: {
    Labels: [
      {
        Name: 'Tree',
        Confidence: 99.1,
        Instances: [],
        Parents: [
          { Name: 'Plant' }
        ]
      },
      {
        Name: 'Lake',
        Confidence: 97.5,
        Instances: [],
        Parents: [
          { Name: 'Water' },
          { Name: 'Outdoors' }
        ]
      },
      {
        Name: 'Mountain',
        Confidence: 96.3,
        Instances: [],
        Parents: [
          { Name: 'Nature' },
          { Name: 'Outdoors' }
        ]
      },
      {
        Name: 'Wilderness',
        Confidence: 93.7,
        Instances: [],
        Parents: [
          { Name: 'Outdoors' }
        ],
        Categories: [
          { Name: 'Scenes' }
        ]
      }
    ],
    OrientationCorrection: 'ROTATE_0'
  },

  // Response with animals
  animals: {
    Labels: [
      {
        Name: 'Cat',
        Confidence: 99.8,
        Instances: [
          {
            BoundingBox: {
              Width: 0.6,
              Height: 0.7,
              Left: 0.2,
              Top: 0.15
            },
            Confidence: 99.8
          }
        ],
        Parents: [
          { Name: 'Animal' },
          { Name: 'Pet' }
        ],
        Categories: [
          { Name: 'Animals and Pets' }
        ]
      },
      {
        Name: 'Kitten',
        Confidence: 95.5,
        Instances: [],
        Parents: [
          { Name: 'Cat' },
          { Name: 'Animal' }
        ],
        Categories: [
          { Name: 'Animals and Pets' }
        ]
      },
      {
        Name: 'Pet',
        Confidence: 99.8,
        Instances: [],
        Parents: []
      },
      {
        Name: 'Animal',
        Confidence: 99.8,
        Instances: [],
        Parents: []
      }
    ],
    OrientationCorrection: 'ROTATE_0'
  },

  // Response with food items
  food: {
    Labels: [
      {
        Name: 'Food',
        Confidence: 98.7,
        Instances: [],
        Parents: []
      },
      {
        Name: 'Pizza',
        Confidence: 97.5,
        Instances: [
          {
            BoundingBox: {
              Width: 0.8,
              Height: 0.6,
              Left: 0.1,
              Top: 0.2
            },
            Confidence: 97.5
          }
        ],
        Parents: [
          { Name: 'Food' }
        ],
        Categories: [
          { Name: 'Food and Beverage' }
        ]
      },
      {
        Name: 'Cheese',
        Confidence: 94.3,
        Instances: [],
        Parents: [
          { Name: 'Food' },
          { Name: 'Dairy' }
        ]
      },
      {
        Name: 'Meal',
        Confidence: 93.6,
        Instances: [],
        Parents: [
          { Name: 'Food' }
        ]
      }
    ],
    OrientationCorrection: 'ROTATE_0'
  },

  // Empty response when no labels are detected
  empty: {
    Labels: [],
    OrientationCorrection: 'ROTATE_0'
  },

  // Error response
  error: {
    message: 'Internal server error',
    code: 'InternalServerError',
    statusCode: 500,
    requestId: 'EXAMPLE123456789'
  }
};

/**
 * Rekognition Moderation Label Detection Responses
 */
const rekognitionDetectModerationLabelsResponses = {
  // Clean content with no moderation flags
  clean: {
    ModerationLabels: [],
    ModerationModelVersion: '4.0'
  },

  // Content with explicit nudity
  explicit: {
    ModerationLabels: [
      {
        Confidence: 98.7,
        Name: 'Explicit Nudity',
        ParentName: ''
      },
      {
        Confidence: 98.7,
        Name: 'Nudity',
        ParentName: 'Explicit Nudity'
      },
      {
        Confidence: 84.5,
        Name: 'Graphic Male Nudity',
        ParentName: 'Explicit Nudity'
      }
    ],
    ModerationModelVersion: '4.0'
  },

  // Content with violence
  violence: {
    ModerationLabels: [
      {
        Confidence: 87.2,
        Name: 'Violence',
        ParentName: ''
      },
      {
        Confidence: 87.2,
        Name: 'Graphic Violence Or Gore',
        ParentName: 'Violence'
      },
      {
        Confidence: 87.2,
        Name: 'Physical Violence',
        ParentName: 'Violence'
      }
    ],
    ModerationModelVersion: '4.0'
  },

  // Content with weapons
  weapons: {
    ModerationLabels: [
      {
        Confidence: 92.1,
        Name: 'Violence',
        ParentName: ''
      },
      {
        Confidence: 92.1,
        Name: 'Weapons',
        ParentName: 'Violence'
      },
      {
        Confidence: 87.5,
        Name: 'Weapons Firearms',
        ParentName: 'Weapons'
      }
    ],
    ModerationModelVersion: '4.0'
  },

  // Content with drugs
  drugs: {
    ModerationLabels: [
      {
        Confidence: 85.4,
        Name: 'Drugs & Tobacco',
        ParentName: ''
      },
      {
        Confidence: 85.4,
        Name: 'Drug Products',
        ParentName: 'Drugs & Tobacco'
      }
    ],
    ModerationModelVersion: '4.0'
  },

  // Mixed content with different moderation flags
  mixed: {
    ModerationLabels: [
      {
        Confidence: 87.3,
        Name: 'Violence',
        ParentName: ''
      },
      {
        Confidence: 68.9,
        Name: 'Suggestive',
        ParentName: ''
      },
      {
        Confidence: 68.9,
        Name: 'Revealing Clothes',
        ParentName: 'Suggestive'
      }
    ],
    ModerationModelVersion: '4.0'
  },

  // Error response
  error: {
    message: 'The image format is not valid or is corrupted',
    code: 'InvalidImageFormatException',
    statusCode: 400,
    requestId: 'EXAMPLE123456789'
  }
};

/**
 * Helper functions to generate dynamic responses
 */

/**
 * Generate a custom S3 upload success response
 * @param {Object} options - Options for the response
 * @param {string} options.key - The object key
 * @param {string} options.bucket - The bucket name
 * @returns {S3UploadSuccessResponse} The customized success response
 */
function generateS3UploadSuccessResponse(options = {}) {
  const key = options.key || `image-${Date.now()}.jpg`;
  const bucket = options.bucket || 'test-bucket';
  
  return {
    ETag: `"${Math.random().toString(36).substring(2, 15)}"`,
    VersionId: `v${Math.floor(Math.random() * 1000)}`,
    Location: `https://${bucket}.s3.amazonaws.com/${key}`,
    Key: key,
    Bucket: bucket
  };
}

/**
 * Generate a custom error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {Object} The customized error response
 */
function generateErrorResponse(message, code, statusCode = 400) {
  return {
    message,
    code,
    statusCode,
    requestId: `req-${Math.random().toString(36).substring(2, 15)}`
  };
}

/**
 * Generate custom image label detection response
 * @param {Object} options - Options for generating labels
 * @param {Array<Object>} options.labels - Array of label objects to include
 * @param {string} options.orientation - Orientation correction value
 * @returns {RekognitionDetectLabelsResponse} The customized labels response
 */
function generateLabelsResponse(options = {}) {
  const labels = options.labels || [];
  const orientation = options.orientation || 'ROTATE_0';
  
  return {
    Labels: labels,
    OrientationCorrection: orientation
  };
}

/**
 * Create a label object for use in label responses
 * @param {string} name - Name of the label
 * @param {number} confidence - Confidence score (0-100)
 * @param {Array<Object>} parents - Array of parent label names
 * @param {Array<Object>} categories - Array of categories
 * @returns {Object} A properly formatted label object
 */
function createLabel(name, confidence, parents = [], categories = []) {
  return {
    Name: name,
    Confidence: confidence,
    Instances: [],
    Parents: parents.map(p => ({ Name: p })),
    Categories: categories.map(c => ({ Name: c }))
  };
}

/**
 * Generate custom moderation label detection response
 * @param {Array<Object>} moderationLabels - Array of moderation label objects
 * @returns {RekognitionDetectModerationLabelsResponse} The customized moderation response
 */
function generateModerationResponse(moderationLabels = []) {
  return {
    ModerationLabels: moderationLabels,
    ModerationModelVersion: '4.0'
  };
}

/**
 * Create a moderation label object
 * @param {string} name - Name of the moderation label
 * @param {number} confidence - Confidence score (0-100)
 * @param {string} parentName - Name of the parent label
 * @returns {Object} A properly formatted moderation label object
 */
function createModerationLabel(name, confidence, parentName = '') {
  return {
    Name: name,
    Confidence: confidence,
    ParentName: parentName
  };
}

module.exports = {
  // S3 Responses
  s3UploadSuccessResponse,
  s3DeleteSuccessResponse,
  s3UploadErrorResponses,
  s3NotFoundResponse,
  
  // Rekognition Responses
  rekognitionDetectLabelsResponses,
  rekognitionDetectModerationLabelsResponses,
  
  // Helper Functions
  generateS3UploadSuccessResponse,
  generateErrorResponse,
  generateLabelsResponse,
  createLabel,
  generateModerationResponse,
  createModerationLabel
};