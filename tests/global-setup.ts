import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Suite for MEDMIND');
  console.log('📋 Test Configuration:');
  console.log(`   - Base URL: ${config.projects[0]?.use?.baseURL || 'http://localhost:8080'}`);
  console.log(`   - Workers: ${config.workers}`);
  console.log(`   - Retries: ${config.projects[0]?.retries || 0}`);
  
  // Verify environment variables
  if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
    console.warn('⚠️  Warning: TEST_USER_EMAIL and TEST_USER_PASSWORD not set.');
    console.warn('   Tests will use default test credentials.');
    console.warn('   Set these environment variables for proper test execution:');
    console.warn('   export TEST_USER_EMAIL="your-test-email@example.com"');
    console.warn('   export TEST_USER_PASSWORD="your-test-password"');
  }
  
  // Optional: Create screenshots directory
  const fs = await import('fs');
  const screenshotsDir = 'tests/screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Optional: Pre-warm the application by making a request
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(config.projects[0]?.use?.baseURL || 'http://localhost:8080', {
      timeout: 30000,
      waitUntil: 'networkidle',
    });
    await browser.close();
    console.log('✅ Application is accessible');
  } catch (error) {
    console.error('❌ Failed to access application. Make sure dev server is running.');
    console.error('   Run: npm run dev');
  }
  
  console.log('');
  console.log('🧪 Running tests...');
}

export default globalSetup;
