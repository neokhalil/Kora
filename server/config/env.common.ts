/**
 * Common configuration shared across all environments
 * This file should contain configurations that are environment-agnostic
 */

import path from 'path';

export const commonConfig = {
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB max file size
    directory: path.join(process.cwd(), 'uploads'),
  },
  api: {
    openai: {
      // The API key itself is loaded from environment variables
      // This just defines the structure
    },
  },
};

export default commonConfig;