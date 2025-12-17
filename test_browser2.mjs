import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting browser test with console capture...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('Hybrid') || text.includes('keypoints') || text.includes('skeleton') || text.includes('🎨') || text.includes('🖼️') || text.includes('❌')) {
      console.log(`[BROWSER ${type}] ${text}`);
    }
  });
  
  console.log('📍 Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  console.log('✅ Step 1: Home page loaded');
  
  const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/shooter1.jpg';
  
  console.log('📤 Uploading test image...');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testImage);
    console.log('✅ File uploaded');
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('🔍 Looking for Analyze button...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Analyze')) {
      console.log('✅ Found Analyze button, clicking...');
      await btn.click();
      break;
    }
  }
  
  console.log('⏳ Waiting for analysis and navigation...');
  await new Promise(r => setTimeout(r, 15000));
  
  const url = page.url();
  console.log('📍 Current URL:', url);
  
  // Check if we're on results page and log the visionAnalysis data
  const storeData = await page.evaluate(() => {
    // Try to get data from zustand store
    const store = window.__ZUSTAND_STORE__;
    if (store) {
      const state = store.getState();
      return {
        hasVisionResult: !!state.visionAnalysisResult,
        keypoints: state.visionAnalysisResult?.keypoints ? Object.keys(state.visionAnalysisResult.keypoints) : null,
        imageSize: state.visionAnalysisResult?.image_size,
        hasUploadedImage: !!state.uploadedImageBase64
      };
    }
    return { error: 'Store not found' };
  });
  console.log('📊 Store data:', JSON.stringify(storeData, null, 2));
  
  await page.screenshot({ path: '/tmp/step4_final.png', fullPage: true });
  console.log('✅ Screenshot saved');
  
  // Keep browser open
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
