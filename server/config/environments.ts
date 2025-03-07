/**
 * Environment configuration management for Kora application
 * Simplified for single environment per Repl approach
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Base configuration
const config = {
  environment: 'development', // This will be different in each Repl
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
  database: {
    url: process.env.DATABASE_URL,
    ssl: false,
    logging: true,
  },
  debug: true,
};

// Utility functions for environment checks - simplified for single environment approach
export const isDevelopment = (): boolean => config.environment === 'development';
export const isTest = (): boolean => config.environment === 'test';
export const isProduction = (): boolean => config.environment === 'production';

// Log the current environment
console.log(`Running in ${config.environment} environment`);

export { config };
export default config;