/**
 * Production environment specific configuration
 */

import { commonConfig } from './env.common';

export const productionConfig = {
  environment: 'production',
  server: {
    port: process.env.PORT || 5000,
  },
  database: {
    url: process.env.PROD_DATABASE_URL || process.env.DATABASE_URL,
    ssl: true,
    logging: false,  // No logging in production for better performance
  },
  debug: false,      // No debug mode in production
  ...commonConfig,
};

export default productionConfig;