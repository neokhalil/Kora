/**
 * Test environment specific configuration
 */

import { AppConfig } from './types';
import { commonConfig } from './env.common';

export const testConfig: AppConfig = {
  environment: 'test',
  server: {
    port: process.env.PORT || 5000,
  },
  database: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    ssl: false,
    logging: false,  // Reduced logging in test environment
  },
  debug: true,
  ...commonConfig,
};

export default testConfig;