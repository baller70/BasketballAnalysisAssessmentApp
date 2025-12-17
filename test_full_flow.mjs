import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing FULL FLOW with Kyle Korver image...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    // Log important messages
    if (text.includes('🏀') || text.includes('✅') || text.includes('❌') || 
        text.includes('Analysis') || text.includes('Step') || text.includes('skeleton') ||
        text.includes('Flaw') || text.includes('Score')) {
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
  
  // Wait for progress screen
  console.log('⏳ Watching for progress screen...');
  await new Promise(r => setTimeout(r, 3000));
  
  // Check if progress screen is visible
  const progressVisible = await page.evaluate(() => {
    const progressScreen = document.querySelector('[class*="fixed"][class*="inset-0"]');
    return !!progressScreen;
  });
  console.log(`📊 Progress screen visible: ${progressVisible}`);
  
  // Screenshot the progress screen
  if (progressVisible) {
    await page.screenshot({ path: '/tmp/progress_screen.png', fullPage: true });
    console.log('✅ Progress screen screenshot saved');
  }
  
  // Wait for analysis to complete
  console.log('⏳ Waiting for analysis to complete...');
  await new Promise(r => setTimeout(r, 15000));
  
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
  
  // Check analytics data
  const analyticsData = await page.evaluate(() => {
    // Look for score displays
    const scoreEls = document.querySelectorAll('[class*="text-2xl"], [class*="text-3xl"]');
    const scores = Array.from(scoreEls).map(el => el.textContent).filter(t => t && t.includes('%'));
    
    // Look for angle displays
    const angleEls = document.querySelectorAll('[class*="font-semibold"]');
    const angles = Array.from(angleEls).map(el => el.textContent).filter(t => t && t.includes('°'));
    
    return { scores, angles };
  });
  console.log('📊 Analytics data:', JSON.stringify(analyticsData));
  
  await page.screenshot({ path: '/tmp/full_flow_test.png', fullPage: true });
  console.log('✅ Full page screenshot saved to /tmp/full_flow_test.png');
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
