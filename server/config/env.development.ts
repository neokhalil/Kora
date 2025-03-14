/**
 * Development environment specific configuration
 */

import { commonConfig } from './env.common';

export const developmentConfig = {
  environment: 'development',
  server: {
    port: process.env.PORT || 5000,
  },
  database: {
    url: process.env.DATABASE_URL,
    ssl: false,
    logging: true,
  },
  debug: true,
  ...commonConfig,
};

export default developmentConfig;