import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing FIXED SESSION GALLERY with Kyle Korver...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log('✅ Home page loaded');
  
  // Use OFFICIAL Kyle Korver test image
  const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testImage);
    console.log('✅ Kyle Korver image uploaded');
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Click Analyze
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Analyze')) {
      await btn.click();
      console.log('✅ Analyze button clicked');
      break;
    }
  }
  
  // Wait for analysis
  console.log('⏳ Waiting for analysis...');
  await new Promise(r => setTimeout(r, 20000));
  
  // Click on PLAYER ASSESSMENT tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('PLAYER ASSESSMENT')) {
      await tab.click();
      console.log('✅ Clicked PLAYER ASSESSMENT tab');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/gallery_fixed.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/gallery_fixed.png');
  
  // Check for layout elements
  const layoutInfo = await page.evaluate(() => {
    // Check for canvas (skeleton)
    const canvases = document.querySelectorAll('canvas');
    // Check for AutoScreenshots (should have actual images, not emojis)
    const screenshotImages = document.querySelectorAll('img[alt="Ball & Hands"], img[alt="Shoulder & Arms"], img[alt="Legs & Base"]');
    // Check that joint angles and confidence are GONE
    const hasJointAngles = document.body.innerText.includes('Joint Angles');
    const hasConfidence = document.body.innerText.includes('Confidence') && document.body.innerText.includes('Keypoints Detected');
    
    return {
      canvasCount: canvases.length,
      screenshotImagesFound: screenshotImages.length,
      hasJointAngles,
      hasConfidence
    };
  });
  
  console.log('📊 Layout check:', JSON.stringify(layoutInfo, null, 2));
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
