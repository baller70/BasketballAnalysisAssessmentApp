import { test, expect } from '@playwright/test';

test('upload image and check results', async ({ page }) => {
  // Go to home page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of home page
  await page.screenshot({ path: 'home-page.png', fullPage: true });
  
  // Find an image upload slot and upload a test image
  // First, let's see what's on the page
  const content = await page.content();
  console.log('Page has file inputs:', content.includes('input type="file"'));
  
  // Wait for page to fully load
  await page.waitForTimeout(2000);
  
  // Take another screenshot
  await page.screenshot({ path: 'home-ready.png', fullPage: true });
});
