const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  // Go to home page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  console.log('Home page loaded');
  
  // Upload Kyle Korver image
  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg');
  console.log('Image uploaded');
  await page.waitForTimeout(1000);
  
  // Click the Analyze button
  const analyzeButton = await page.locator('button:has-text("Analyze")').first();
  if (await analyzeButton.isVisible()) {
    console.log('Clicking Analyze button');
    await analyzeButton.click();
  }
  
  // Wait for navigation to results page (longer wait)
  console.log('Waiting for analysis to complete...');
  await page.waitForTimeout(30000);
  
  // Take screenshot of results
  await page.screenshot({ path: 'results-full.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Scroll to different parts of the page
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'results-scroll1.png', fullPage: false });
  
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'results-scroll2.png', fullPage: false });
  
  await browser.close();
})();
