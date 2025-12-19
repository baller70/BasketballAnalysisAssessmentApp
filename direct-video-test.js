const { chromium } = require('playwright');

(async () => {
  console.log('Starting...');
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Home loaded');
  
  // Select Video mode
  await page.click('text=Images');
  await page.waitForTimeout(500);
  
  // Click on Video option in dropdown
  await page.locator('div').filter({ hasText: /^VideoUpload a 10-second video$/ }).first().click();
  await page.waitForTimeout(1000);
  console.log('Video mode selected');
  
  await page.screenshot({ path: 'direct-1-video-mode.png', fullPage: true });
  
  // Now directly set the file on the hidden input
  // The input is inside a label, we need to make it visible first or use setInputFiles
  const videoInputs = await page.locator('input[accept="video/*"]').all();
  console.log('Found video inputs:', videoInputs.length);
  
  if (videoInputs.length > 0) {
    // Use the first one
    await videoInputs[0].setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    console.log('File set on input');
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'direct-2-after-upload.png', fullPage: true });
  
  // Check if video preview is showing
  const videoPreview = await page.locator('video').count();
  console.log('Video preview elements:', videoPreview);
  
  // Check analyze button
  const analyzeBtn = page.locator('button:has-text("Analyze")');
  const isDisabled = await analyzeBtn.isDisabled();
  console.log('Analyze button disabled:', isDisabled);
  
  if (!isDisabled) {
    console.log('Clicking Analyze...');
    await analyzeBtn.click();
    
    // Wait for analysis to complete
    console.log('Waiting for analysis (up to 2 minutes)...');
    try {
      await page.waitForURL('**/results/**', { timeout: 120000 });
      console.log('Navigated to results!');
    } catch (e) {
      console.log('Still on same page after timeout');
    }
  } else {
    console.log('Button is disabled - video might not have uploaded');
    // Try alternative - click on the upload area
    const uploadLabel = page.locator('label:has-text("Click to upload video")');
    if (await uploadLabel.count() > 0) {
      console.log('Found upload label, trying direct file input...');
    }
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'direct-3-final.png', fullPage: true });
  
  // Scroll through results
  for (let y = 0; y <= 2400; y += 600) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `direct-scroll-${y}.png` });
  }
  
  await browser.close();
  console.log('Test complete');
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
