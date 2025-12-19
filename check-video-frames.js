const { chromium } = require('playwright');

(async () => {
  console.log('Starting...');
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Select Video mode
  await page.click('button:has-text("Images")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Video"):has-text("10-second")');
  await page.waitForTimeout(1000);
  
  // Upload video
  const videoInput = page.locator('input[accept="video/*"]');
  await videoInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
  await page.waitForTimeout(3000);
  
  // Click analyze
  await page.click('button:has-text("Analyze")');
  
  // Wait for results
  await page.waitForURL('**/results/**', { timeout: 120000 });
  await page.waitForTimeout(5000);
  
  // Take screenshot of initial state (frame 0 - starter screen)
  await page.screenshot({ path: 'video-frame-0.png', fullPage: true });
  
  // Click the "next frame" button multiple times to advance through the video
  const nextBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(3); // Forward button
  
  // Advance to frame 10
  for (let i = 0; i < 10; i++) {
    await nextBtn.click();
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: 'video-frame-10.png', fullPage: true });
  
  // Advance to frame 50
  for (let i = 0; i < 40; i++) {
    await nextBtn.click();
    await page.waitForTimeout(100);
  }
  await page.screenshot({ path: 'video-frame-50.png', fullPage: true });
  
  // Advance to frame 100
  for (let i = 0; i < 50; i++) {
    await nextBtn.click();
    await page.waitForTimeout(100);
  }
  await page.screenshot({ path: 'video-frame-100.png', fullPage: true });
  
  await browser.close();
  console.log('Done!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
