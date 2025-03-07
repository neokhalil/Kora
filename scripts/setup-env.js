/**
 * Script to set up and manage different environments for the Kora application
 * This script can be used to create test databases, initialize environments, etc.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Constants
const DATABASE_URL = process.env.DATABASE_URL;
const TEST_DATABASE_SUFFIX = '_test';
const PROD_DATABASE_SUFFIX = '_prod';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

/**
 * Create a test database cloned from the development database
 */
async function createTestDatabase() {
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  try {
    // Extract database name from the connection string
    const dbName = DATABASE_URL.split('/').pop();
    
    // Create test database name
    const testDbName = `${dbName}${TEST_DATABASE_SUFFIX}`;
    
    console.log(`Creating test database: ${testDbName}`);
    
    // Create a new database connection URL for the test database
    const testDbUrl = DATABASE_URL.replace(dbName, testDbName);
    
    // Set up test database URLs in .env file
    updateEnvFile('TEST_DATABASE_URL', testDbUrl);
    
    console.log('Successfully set up test database configuration');
  } catch (error) {
    console.error('Error creating test database:', error);
    process.exit(1);
  }
}

/**
 * Create a production database configuration
 */
async function createProductionConfig() {
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  try {
    // Extract database name from the connection string
    const dbName = DATABASE_URL.split('/').pop();
    
    // Create production database name
    const prodDbName = `${dbName}${PROD_DATABASE_SUFFIX}`;
    
    console.log(`Creating production database configuration: ${prodDbName}`);
    
    // Create a new database connection URL for the production database
    const prodDbUrl = DATABASE_URL.replace(dbName, prodDbName);
    
    // Set up production database URLs in .env file
    updateEnvFile('PROD_DATABASE_URL', prodDbUrl);
    
    console.log('Successfully set up production database configuration');
  } catch (error) {
    console.error('Error creating production database configuration:', error);
    process.exit(1);
  }
}

/**
 * Update or add a key-value pair in the .env file
 */
function updateEnvFile(key, value) {
  const envFilePath = path.resolve(process.cwd(), '.env');
  
  if (!fs.existsSync(envFilePath)) {
    fs.writeFileSync(envFilePath, '');
  }
  
  const envFileContent = fs.readFileSync(envFilePath, 'utf8');
  const envLines = envFileContent.split('\n');
  
  // Check if the key already exists in the .env file
  const keyIndex = envLines.findIndex(line => line.startsWith(`${key}=`));
  
  if (keyIndex !== -1) {
    // Update existing key
    envLines[keyIndex] = `${key}=${value}`;
  } else {
    // Add new key
    envLines.push(`${key}=${value}`);
  }
  
  // Write updated content back to .env file
  fs.writeFileSync(envFilePath, envLines.join('\n'));
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Kora Environment Setup Script
=============================

Available commands:
  setup-test     : Set up a test database configuration
  setup-prod     : Set up a production database configuration
  help           : Show this help message

Example:
  node scripts/setup-env.js setup-test
  `);
}

// Main command handler
async function main() {
  switch (command) {
    case 'setup-test':
      await createTestDatabase();
      break;
    case 'setup-prod':
      await createProductionConfig();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Execute the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});