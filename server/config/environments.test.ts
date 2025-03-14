/**
 * Environment configuration specifically for TEST environment
 * This overrides the base configuration in environments.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import baseConfig from './environments';

// Load environment variables from .env file
dotenv.config();

// Create a custom configuration for the test environment
const testConfig = {
  ...baseConfig,
  environment: 'test', // Changed from 'development' to 'test'
  server: {
    ...baseConfig.server,
    port: process.env.PORT || 5001, // Modified port for test environment
  },
  debug: true,
};

// Utility functions for environment checks - export the same functions as the base file
export const isDevelopment = (): boolean => testConfig.environment === 'development';
export const isTest = (): boolean => testConfig.environment === 'test';
export const isProduction = (): boolean => testConfig.environment === 'production';

// Log the current environment
console.log(`Running in ${testConfig.environment} environment`);

// Export the test configuration
export const config = testConfig;
export default testConfig;