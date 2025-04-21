// Copyright 2017 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { join, basename } from 'path';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import type { IConfig } from 'config';
import * as log from '../ts/logging/log';

import {
  Environment,
  getEnvironment,
  setEnvironment,
  parseEnvironment,
} from '../ts/environment';

// Define AWS credential interfaces
interface AwsCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  region?: string;
}

// In production mode, NODE_ENV cannot be customized by the user
if (app.isPackaged) {
  setEnvironment(Environment.PackagedApp, false);
} else {
  setEnvironment(
    parseEnvironment(process.env.NODE_ENV || 'development'),
    Boolean(process.env.MOCK_TEST)
  );
}

// Set environment vars to configure node-config before requiring it
process.env.NODE_ENV = getEnvironment();
process.env.NODE_CONFIG_DIR = join(__dirname, '..', 'config');

if (getEnvironment() === Environment.PackagedApp) {
  // harden production config against the local env
  process.env.NODE_CONFIG = '';
  process.env.NODE_CONFIG_STRICT_MODE = '';
  process.env.HOSTNAME = '';
  process.env.NODE_APP_INSTANCE = '';
  process.env.ALLOW_CONFIG_MUTATIONS = '';
  process.env.SUPPRESS_NO_CONFIG_WARNING = '';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '';
  process.env.SIGNAL_ENABLE_HTTP = '';
  process.env.SIGNAL_CI_CONFIG = '';
  process.env.GENERATE_PRELOAD_CACHE = '';
  process.env.REACT_DEVTOOLS = '';
  
  // Clear AWS specific environment variables in production
  process.env.AWS_ACCESS_KEY_ID = '';
  process.env.AWS_SECRET_ACCESS_KEY = '';
  process.env.AWS_SESSION_TOKEN = '';
}

// We load config after we've made our modifications to NODE_ENV
// Note: we use `require()` because esbuild moves the imports to the top of
// the module regardless of their actual placement in the file.
// See: https://github.com/evanw/esbuild/issues/2011
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: IConfig = require('config');

if (getEnvironment() !== Environment.PackagedApp) {
  config.util.getConfigSources().forEach(source => {
    console.log(`config: Using config source ${basename(source.name)}`);
  });
}

// Log resulting env vars in use by config
[
  'NODE_ENV',
  'NODE_CONFIG_DIR',
  'NODE_CONFIG',
  'ALLOW_CONFIG_MUTATIONS',
  'HOSTNAME',
  'NODE_APP_INSTANCE',
  'SUPPRESS_NO_CONFIG_WARNING',
  'SIGNAL_ENABLE_HTTP',
].forEach(s => {
  console.log(`${s} ${config.util.getEnv(s)}`);
});

/**
 * Securely load AWS credentials from environment variables or configuration files
 * Following AWS SDK best practices for credential loading
 * @returns AWS credentials object or undefined if not available
 */
function loadAwsCredentials(): AwsCredentials | undefined {
  try {
    // First try environment variables (highest priority)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
        region: process.env.AWS_REGION || 'us-east-1'
      };
    }

    // For development only - try loading from AWS credentials file
    if (getEnvironment() !== Environment.PackagedApp) {
      const homeDir = app.getPath('home');
      const awsCredentialsPath = path.join(homeDir, '.aws', 'credentials');
      
      if (fs.existsSync(awsCredentialsPath)) {
        try {
          // Simple INI parser for credentials file
          const content = fs.readFileSync(awsCredentialsPath, 'utf8');
          const defaultProfile = content
            .split('[default]')[1]?.split('[')[0]
            ?.trim();
          
          if (defaultProfile) {
            // Extract credentials using regex
            const accessKeyMatch = defaultProfile.match(/aws_access_key_id\s*=\s*([^\n]+)/);
            const secretKeyMatch = defaultProfile.match(/aws_secret_access_key\s*=\s*([^\n]+)/);
            const regionMatch = defaultProfile.match(/region\s*=\s*([^\n]+)/);
            
            if (accessKeyMatch && secretKeyMatch) {
              return {
                accessKeyId: accessKeyMatch[1].trim(),
                secretAccessKey: secretKeyMatch[1].trim(),
                region: regionMatch ? regionMatch[1].trim() : 'us-east-1'
              };
            }
          }
        } catch (credError) {
          log.warn(
            'Failed to load AWS credentials from credentials file:',
            credError instanceof Error ? credError.message : 'Unknown error'
          );
        }
      }
      
      // Try loading from config file if credentials file failed
      const awsConfigPath = path.join(homeDir, '.aws', 'config');
      if (fs.existsSync(awsConfigPath)) {
        try {
          const content = fs.readFileSync(awsConfigPath, 'utf8');
          // Similar parsing logic could be implemented here
          // This is simplified for brevity
        } catch (configError) {
          log.warn(
            'Failed to load AWS config from config file:',
            configError instanceof Error ? configError.message : 'Unknown error'
          );
        }
      }
    }
    
    return undefined;
  } catch (e) {
    log.error(
      'Error loading AWS credentials:',
      e instanceof Error ? e.message : 'Unknown error'
    );
    return undefined;
  }
}

// Get AWS credentials following the provider chain pattern
const awsCredentials = loadAwsCredentials();

// Log appropriate messages about AWS credential status
if (awsCredentials?.accessKeyId && awsCredentials?.secretAccessKey) {
  log.info('AWS credentials loaded successfully');
} else if (getEnvironment() !== Environment.PackagedApp) {
  log.warn(
    'AWS credentials not found. Image upload and tagging features will not work. ' +
    'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables ' +
    'or configure ~/.aws/credentials file.'
  );
}

// Configure AWS services with enhanced security and validation
if (!config.has('aws')) {
  // Default secure configuration
  const awsConfig = {
    // Core AWS configuration
    credentials: {
      // Only include actual credentials if found and not in production
      ...(awsCredentials && getEnvironment() !== Environment.PackagedApp
        ? {
            accessKeyId: awsCredentials.accessKeyId,
            secretAccessKey: awsCredentials.secretAccessKey,
            ...(awsCredentials.sessionToken ? { sessionToken: awsCredentials.sessionToken } : {})
          }
        : {}),
      // Always specify how credentials should be loaded at runtime
      loadMethod: 'auto', // 'auto', 'env', 'file', 'instance' (EC2/ECS), 'web' (for browser)
    },
    region: awsCredentials?.region || process.env.AWS_REGION || 'us-east-1',
    
    // Security configuration
    useSSL: true, // Always use SSL for AWS API calls
    maxRetries: 3,
    timeout: 15000, // 15 second timeout
    
    // S3 configuration for image uploads
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME || 'signal-content-images',
      baseUrl: process.env.AWS_S3_BASE_URL || '',
      // S3 security settings
      encryption: {
        enabled: true,
        algorithm: 'AES256', // Server-side encryption
      },
      // ACL settings
      acl: 'private',
      // Reasonable upload limits
      maxFileSize: 10 * 1024 * 1024, // 10 MB
    },
    
    // Rekognition configuration for image tagging
    rekognition: {
      minConfidence: Number(process.env.AWS_REKOGNITION_MIN_CONFIDENCE || 60),
      moderation: {
        enabled: process.env.AWS_ENABLE_MODERATION !== 'false', // Enabled by default
        threshold: Number(process.env.AWS_MODERATION_THRESHOLD || 70),
      },
      cacheTTL: Number(process.env.AWS_REKOGNITION_CACHE_TTL || 3600),
      // Configure response verification to prevent spoofing
      responseVerification: {
        enabled: true,
        validateSignature: true,
      },
    }
  };
  
  // Validate configuration before applying
  if (
    typeof awsConfig.s3.maxFileSize !== 'number' || 
    awsConfig.s3.maxFileSize <= 0 ||
    typeof awsConfig.rekognition.minConfidence !== 'number' ||
    awsConfig.rekognition.minConfidence < 0 ||
    awsConfig.rekognition.minConfidence > 100
  ) {
    log.error('Invalid AWS configuration parameters. Using defaults.');
    // Reset to defaults if validation fails
    awsConfig.s3.maxFileSize = 10 * 1024 * 1024;
    awsConfig.rekognition.minConfidence = 60;
  }
  
  // Apply configuration
  config.util.extendDeep(config, { aws: awsConfig });
}

export default config;
export type { IConfig as ConfigType };