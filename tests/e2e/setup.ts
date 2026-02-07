/**
 * Setup file for Puppeteer E2E tests
 * Runs before all tests
 */

import * as fs from 'fs';
import * as path from 'path';

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log('📁 Created screenshots directory');
}

// Load environment variables from .env.test if it exists
const envTestPath = path.join(process.cwd(), '.env.test');
if (fs.existsSync(envTestPath)) {
  require('dotenv').config({ path: envTestPath });
  console.log('✅ Loaded .env.test configuration');
}

// Global test setup
beforeAll(() => {
  console.log('');
  console.log('🧪 ========================================');
  console.log('🧪 Assessment Test E2E Suite');
  console.log('🧪 ========================================');
  console.log('');
});

// Global test teardown
afterAll(() => {
  console.log('');
  console.log('✅ ========================================');
  console.log('✅ Test Suite Completed');
  console.log('✅ ========================================');
  console.log('');
});
