const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();
  
  // Go to home page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Upload Kyle Korver image
  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg');
  await page.waitForTimeout(1000);
  
  // Click the Analyze button
  const analyzeButton = await page.locator('button:has-text("Analyze")').first();
  await analyzeButton.click();
  
  // Wait for URL to change to results page
  console.log('Waiting for navigation to results...');
  try {
    await page.waitForURL('**/results/**', { timeout: 60000 });
    console.log('Navigated to results page');
  } catch (e) {
    console.log('Timeout waiting for results, taking screenshot anyway');
  }
  
  // Wait a bit more for page to fully render
  await page.waitForTimeout(3000);
  
  // Take full page screenshot
  await page.screenshot({ path: 'final-results.png', fullPage: true });
  console.log('Full page screenshot saved');
  
  // Scroll and take more screenshots to see all content
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Page height:', pageHeight);
  
  // Take viewport screenshots at different scroll positions
  for (let y = 0; y < pageHeight; y += 600) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `scroll-${y}.png`, fullPage: false });
    console.log(`Screenshot at scroll ${y}`);
  }
  
  await browser.close();
})();
