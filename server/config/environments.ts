/**
 * Environment configuration management for Kora application
 * Modular architecture with environment-specific configuration files
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Import environment-specific configurations
import developmentConfig from './env.development';
import testConfig from './env.test';
import productionConfig from './env.production';

// Determine which configuration to use based on NODE_ENV
// Default to development if not specified
const nodeEnv = process.env.NODE_ENV || 'development';

let config;
switch (nodeEnv.toLowerCase()) {
  case 'production':
    config = productionConfig;
    break;
  case 'test':
    config = testConfig;
    break;
  case 'development':
  default:
    config = developmentConfig;
    break;
}

// Add runtime environment variables that shouldn't be stored in files
config.api = {
  ...config.api,
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  }
};

// Utility functions for environment checks
export const isDevelopment = (): boolean => config.environment === 'development';
export const isTest = (): boolean => config.environment === 'test';
export const isProduction = (): boolean => config.environment === 'production';

// Log the current environment
console.log(`Running in ${config.environment} environment`);

export { config };
export default config;