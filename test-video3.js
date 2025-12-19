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
  
  await page.screenshot({ path: 'v3-step1-video-mode.png', fullPage: true });
  
  // Find the video upload area and its file input
  // The file input might be hidden, so we need to find it properly
  const fileInput = await page.locator('input[type="file"][accept*="video"]').first();
  
  if (await fileInput.count() > 0) {
    console.log('Found video file input');
    await fileInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    console.log('Video uploaded via file input');
  } else {
    // Try clicking on the upload area first to trigger file dialog
    console.log('Trying to find upload area...');
    const uploadArea = await page.locator('text=Click to upload video').first();
    if (await uploadArea.isVisible()) {
      // Get the file input that's associated with this area
      const allInputs = await page.locator('input[type="file"]').all();
      console.log('Total file inputs:', allInputs.length);
      
      for (let i = 0; i < allInputs.length; i++) {
        const accept = await allInputs[i].getAttribute('accept');
        console.log(`Input ${i} accept:`, accept);
        if (accept && accept.includes('video')) {
          await allInputs[i].setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
          console.log('Uploaded to input', i);
          break;
        }
      }
    }
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'v3-step2-after-upload.png', fullPage: true });
  
  // Check if analyze button is now enabled
  const analyzeBtn = await page.locator('button:has-text("Analyze")').first();
  const isDisabled = await analyzeBtn.getAttribute('disabled');
  console.log('Analyze button disabled:', isDisabled);
  
  if (!isDisabled) {
    console.log('Clicking Analyze button');
    await analyzeBtn.click();
    
    // Wait for analysis
    console.log('Waiting for video analysis...');
    try {
      await page.waitForURL('**/results/**', { timeout: 120000 });
      console.log('Navigated to results');
    } catch (e) {
      console.log('Still on same page, checking progress...');
    }
    
    await page.waitForTimeout(60000);
  } else {
    console.log('Button still disabled, checking page content...');
    const pageContent = await page.content();
    console.log('Has video preview:', pageContent.includes('video'));
  }
  
  await page.screenshot({ path: 'v3-step3-results.png', fullPage: true });
  
  // Scroll through page
  for (let y = 0; y < 2400; y += 600) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `v3-scroll-${y}.png`, fullPage: false });
  }
  
  await browser.close();
})();
