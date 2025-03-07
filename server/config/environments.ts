/**
 * Environment configuration management for Kora application
 * Handles database connections and configuration settings across
 * development, test, and production environments
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Define the environment type
type Environment = 'development' | 'test' | 'production';

// Get the current environment from NODE_ENV, defaulting to 'development'
const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV?.toLowerCase() as Environment;
  
  // Validate that the environment is one of the allowed values
  if (!env || !['development', 'test', 'production'].includes(env)) {
    console.log(`Invalid environment "${env}", defaulting to "development"`);
    return 'development';
  }
  
  return env;
};

// Current environment
const environment = getEnvironment();

// Base configuration for all environments
const baseConfig = {
  server: {
    port: process.env.PORT || 5000,
  },
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB max file size
    directory: path.join(process.cwd(), 'uploads'),
  },
  api: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
};

// Environment-specific configurations
const environmentConfigs = {
  development: {
    ...baseConfig,
    database: {
      url: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL,
      ssl: false,
      logging: true,
    },
    debug: true,
  },
  test: {
    ...baseConfig,
    database: {
      url: process.env.TEST_DATABASE_URL,
      ssl: false,
      logging: false,
    },
    debug: true,
  },
  production: {
    ...baseConfig,
    database: {
      url: process.env.PROD_DATABASE_URL || process.env.DATABASE_URL,
      ssl: true, // Usually required for production database connections
      logging: false,
    },
    debug: false,
  },
};

// Export the current environment configuration
const config = {
  ...environmentConfigs[environment],
  environment // Include the environment name in the config
};

// Utility functions for environment checks
export const isDevelopment = (): boolean => environment === 'development';
export const isTest = (): boolean => environment === 'test';
export const isProduction = (): boolean => environment === 'production';

// Log the current environment (not in production)
if (!isProduction()) {
  console.log(`Running in ${environment} environment`);
}

export { config, environment };
export default config;