import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing with OFFICIAL Kyle Korver image...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Screenshot') || text.includes('skeleton') || text.includes('Image') || text.includes('✅') || text.includes('❌') || text.includes('🏀') || text.includes('keypoints') || text.includes('AutoScreenshots')) {
      console.log(`[BROWSER] ${text}`);
    }
  });
  
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
  
  console.log('⏳ Waiting for analysis...');
  await new Promise(r => setTimeout(r, 20000));
  
  // Check results
  const url = page.url();
  console.log('📍 Current URL:', url);
  
  // Check for skeleton canvas
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { found: false };
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(100, 100, 1, 1).data;
    return {
      found: true,
      width: canvas.width,
      height: canvas.height,
      hasContent: imageData[0] > 0 || imageData[1] > 0 || imageData[2] > 0
    };
  });
  console.log('🖼️ Canvas info:', JSON.stringify(canvasInfo));
  
  // Check for screenshots
  const screenshotCount = await page.evaluate(() => {
    const screenshots = document.querySelectorAll('[class*="grid-cols-3"] img');
    return screenshots.length;
  });
  console.log(`📸 Found ${screenshotCount} screenshots`);
  
  await page.screenshot({ path: '/tmp/korver_official_test.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/korver_official_test.png');
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
