const { chromium } = require('playwright');

(async () => {
  console.log('Starting...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Home loaded');
  
  // Screenshot initial state
  await page.screenshot({ path: 'v3-0-initial.png', fullPage: true });
  
  // Find and click on the media type selector (the box that says "Images")
  // It should be a clickable div/button that opens a dropdown
  const selector = page.locator('.cursor-pointer, [role="button"]').filter({ hasText: 'Images' }).first();
  
  if (await selector.count() > 0) {
    console.log('Found selector, clicking...');
    await selector.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'v3-1-dropdown-open.png', fullPage: true });
    
    // Now click on Video option
    const videoOpt = page.locator('div, button, span').filter({ hasText: /^Video$/ }).first();
    if (await videoOpt.count() > 0) {
      await videoOpt.click();
      console.log('Clicked Video');
    } else {
      // Try clicking any text containing "Video" and "10-second"
      await page.click('text=Upload a 10-second video');
      console.log('Clicked video upload text');
    }
  } else {
    // Alternative: Look for the select element or any dropdown
    console.log('Trying alternative selector...');
    await page.click('text=SELECT MEDIA TYPE');
    await page.waitForTimeout(500);
    await page.click('text=Video');
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'v3-2-video-mode.png', fullPage: true });
  
  // Check if Video mode is selected by looking for video upload area
  const videoUploadArea = page.locator('text=Click to upload video');
  const isVideoMode = await videoUploadArea.count() > 0;
  console.log('Video mode active:', isVideoMode);
  
  if (isVideoMode) {
    // Upload video
    const videoInputs = await page.locator('input[accept="video/*"]').all();
    console.log('Found video inputs:', videoInputs.length);
    
    if (videoInputs.length > 0) {
      await videoInputs[0].setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
      console.log('Video uploaded');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'v3-3-uploaded.png', fullPage: true });
    
    // Click analyze
    const analyzeBtn = page.locator('button:has-text("Analyze")');
    if (!(await analyzeBtn.isDisabled())) {
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
  await page.screenshot({ path: 'v3-4-results.png', fullPage: true });
  
  // Scroll
  for (let y = 0; y <= 2400; y += 600) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `v3-scroll-${y}.png` });
  }
  
  await browser.close();
  console.log('Done!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
