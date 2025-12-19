const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  // Go to home page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  console.log('Home page loaded');
  
  // Take screenshot
  await page.screenshot({ path: 'step1-home.png', fullPage: true });
  
  // Find file input and upload the Kyle Korver image
  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg');
  console.log('Image uploaded');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step2-after-upload.png', fullPage: true });
  
  // Click the Analyze button
  const analyzeButton = await page.locator('button:has-text("Analyze")').first();
  if (await analyzeButton.isVisible()) {
    console.log('Clicking Analyze button');
    await analyzeButton.click();
    
    // Wait for analysis to complete
    await page.waitForTimeout(15000);
    await page.screenshot({ path: 'step3-results.png', fullPage: true });
  } else {
    console.log('Analyze button not found');
  }
  
  // Scroll down to see more content
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step4-scrolled.png', fullPage: true });
  
  await browser.close();
})();
