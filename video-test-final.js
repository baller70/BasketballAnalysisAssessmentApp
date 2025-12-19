const { chromium } = require('playwright');

(async () => {
  console.log('Starting...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Home loaded');
  
  // Screenshot initial state
  await page.screenshot({ path: 'final-0-initial.png', fullPage: true });
  
  // Click on the dropdown button - it's the one with "Images" text and a chevron
  // Look for the button that contains "Images" and "Upload 3-7 photos"
  const dropdownBtn = page.locator('button').filter({ hasText: 'Images' }).filter({ hasText: 'Upload' }).first();
  
  if (await dropdownBtn.count() > 0) {
    console.log('Found dropdown button');
    await dropdownBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'final-1-dropdown-open.png', fullPage: true });
    
    // Click on Video option in the dropdown
    const videoOption = page.locator('button').filter({ hasText: 'Video' }).filter({ hasText: '10-second' });
    if (await videoOption.count() > 0) {
      console.log('Found Video option');
      await videoOption.click();
      console.log('Clicked Video');
    }
  } else {
    console.log('Dropdown button not found, trying alternative...');
    // Try clicking directly on the Images text
    await page.click('button:has-text("Images")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Video")');
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'final-2-video-mode.png', fullPage: true });
  
  // Check if Video mode is selected
  const videoUploadArea = page.locator('text=Click to upload video');
  const isVideoMode = await videoUploadArea.count() > 0;
  console.log('Video mode active:', isVideoMode);
  
  if (isVideoMode) {
    // Upload video
    const videoInput = page.locator('input[accept="video/*"]');
    await videoInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    console.log('Video uploaded');
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final-3-uploaded.png', fullPage: true });
    
    // Click analyze
    const analyzeBtn = page.locator('button:has-text("Analyze")');
    const isDisabled = await analyzeBtn.isDisabled();
    console.log('Analyze button disabled:', isDisabled);
    
    if (!isDisabled) {
      console.log('Clicking Analyze...');
      await analyzeBtn.click();
      
      try {
        await page.waitForURL('**/results/**', { timeout: 120000 });
        console.log('Navigated to results!');
      } catch (e) {
        console.log('Navigation timeout');
      }
    }
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'final-4-results.png', fullPage: true });
  
  // Scroll
  for (let y = 0; y <= 2400; y += 600) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `final-scroll-${y}.png` });
  }
  
  await browser.close();
  console.log('Done!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
