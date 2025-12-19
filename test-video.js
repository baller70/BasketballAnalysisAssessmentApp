const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();
  
  // Go to home page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  console.log('Home page loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'video-step1-home.png', fullPage: true });
  
  // Click on the media type dropdown and select Video
  const mediaDropdown = await page.locator('text=Images').first();
  if (await mediaDropdown.isVisible()) {
    await mediaDropdown.click();
    await page.waitForTimeout(500);
    
    // Look for Video option
    const videoOption = await page.locator('text=Video').first();
    if (await videoOption.isVisible()) {
      await videoOption.click();
      console.log('Selected Video mode');
      await page.waitForTimeout(1000);
    }
  }
  
  await page.screenshot({ path: 'video-step2-video-mode.png', fullPage: true });
  
  // Find file input and upload the test video
  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
  console.log('Video uploaded');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'video-step3-after-upload.png', fullPage: true });
  
  // Click the Analyze button
  const analyzeButton = await page.locator('button:has-text("Analyze")').first();
  if (await analyzeButton.isVisible()) {
    console.log('Clicking Analyze button');
    await analyzeButton.click();
  }
  
  // Wait for navigation to results page
  console.log('Waiting for video analysis to complete...');
  try {
    await page.waitForURL('**/results/**', { timeout: 120000 });
    console.log('Navigated to results page');
  } catch (e) {
    console.log('Timeout or error:', e.message);
  }
  
  // Wait for page to fully render
  await page.waitForTimeout(5000);
  
  // Take full page screenshot
  await page.screenshot({ path: 'video-results-full.png', fullPage: true });
  console.log('Full page screenshot saved');
  
  // Scroll and take more screenshots
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Page height:', pageHeight);
  
  for (let y = 0; y < Math.min(pageHeight, 3000); y += 600) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `video-scroll-${y}.png`, fullPage: false });
    console.log(`Screenshot at scroll ${y}`);
  }
  
  await browser.close();
})();
