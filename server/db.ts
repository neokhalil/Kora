import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from './config/environments';

neonConfig.webSocketConstructor = ws;

// Get database URL from the environment config
const databaseUrl = config.database.url;

if (!databaseUrl) {
  throw new Error(
    "Database URL must be set in environment configuration. Did you forget to provision a database?",
  );
}

// Configure pool with environment-specific settings
const poolConfig = {
  connectionString: databaseUrl,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined
};

// Create database pool
export const pool = new Pool(poolConfig);

// Log connection status for non-production environments
pool.on('connect', () => {
  if (config.debug) {
    console.log(`Connected to PostgreSQL database (${config.environment} environment)`);
  }
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

// Create Drizzle ORM instance with schema
export const db = drizzle({ client: pool, schema });
