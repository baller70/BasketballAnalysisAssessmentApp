const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  // Go to home page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  console.log('Home page loaded');
  
  // Click on the SELECT MEDIA TYPE to select Video
  await page.click('text=Images');
  await page.waitForTimeout(500);
  await page.click('text=Video');
  await page.waitForTimeout(1000);
  console.log('Video mode selected');
  
  // Find the hidden file input with accept="video/*"
  // Use force: true to interact with hidden elements
  const videoInput = await page.locator('input[type="file"][accept="video/*"]').first();
  await videoInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
  console.log('Video file uploaded');
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'vfinal-step1-uploaded.png', fullPage: true });
  
  // Now the analyze button should be enabled
  const analyzeBtn = await page.locator('button:has-text("Analyze")').first();
  
  // Wait for button to be enabled
  await page.waitForSelector('button:has-text("Analyze"):not([disabled])', { timeout: 10000 }).catch(() => {
    console.log('Button still disabled after 10s');
  });
  
  await page.screenshot({ path: 'vfinal-step2-before-click.png', fullPage: true });
  
  // Force click the button
  await analyzeBtn.click({ force: true });
  console.log('Clicked analyze button');
  
  // Wait for analysis - video takes longer
  console.log('Waiting for video analysis (up to 2 minutes)...');
  
  // Wait for either navigation or the progress to complete
  let navigated = false;
  try {
    await page.waitForURL('**/results/**', { timeout: 120000 });
    navigated = true;
    console.log('Navigated to results page');
  } catch (e) {
    console.log('Did not navigate, checking current state...');
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'vfinal-step3-results.png', fullPage: true });
  
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Scroll through page to capture all content
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Page height:', pageHeight);
  
  for (let y = 0; y < Math.min(pageHeight, 3600); y += 600) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `vfinal-scroll-${y}.png`, fullPage: false });
    console.log(`Screenshot at scroll ${y}`);
  }
  
  await browser.close();
})();
