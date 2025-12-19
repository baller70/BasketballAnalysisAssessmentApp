const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500,
    timeout: 60000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set longer timeouts
  page.setDefaultTimeout(60000);
  
  console.log('Going to home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Page loaded');
  
  // Screenshot
  await page.screenshot({ path: 'simple-1-home.png' });
  
  // Select Video from dropdown
  console.log('Selecting Video mode...');
  const imagesBtn = page.locator('text=Images').first();
  await imagesBtn.click();
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'simple-2-dropdown.png' });
  
  const videoBtn = page.locator('div:has-text("Video")').filter({ hasText: 'Upload a 10-second video' }).first();
  if (await videoBtn.count() > 0) {
    await videoBtn.click();
  } else {
    // Try clicking any Video text
    await page.click('text=Video');
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'simple-3-video-mode.png' });
  
  // Upload video file
  console.log('Uploading video...');
  const fileChooserPromise = page.waitForEvent('filechooser');
  
  // Click the upload area
  const uploadArea = page.locator('text=Click to upload video');
  if (await uploadArea.count() > 0) {
    await uploadArea.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    console.log('Video file selected');
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'simple-4-uploaded.png' });
  
  // Click analyze
  console.log('Looking for Analyze button...');
  const analyzeBtn = page.locator('button:has-text("Analyze")');
  const btnState = await analyzeBtn.isDisabled();
  console.log('Button disabled:', btnState);
  
  if (!btnState) {
    await analyzeBtn.click();
    console.log('Clicked Analyze');
    
    // Wait for analysis
    console.log('Waiting for analysis...');
    await page.waitForTimeout(90000);
  }
  
  await page.screenshot({ path: 'simple-5-results.png', fullPage: true });
  console.log('Final screenshot saved');
  
  // Scroll and capture
  for (let y = 0; y <= 2400; y += 800) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `simple-scroll-${y}.png` });
  }
  
  await browser.close();
  console.log('Done!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
