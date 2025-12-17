import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing with Kyle Korver image...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Screenshot') || text.includes('skeleton') || text.includes('Image') || text.includes('✅') || text.includes('❌')) {
      console.log(`[BROWSER] ${text}`);
    }
  });
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  console.log('✅ Home page loaded');
  
  // Use Kyle Korver image
  const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/shooter1.jpg';
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
  
  console.log('⏳ Waiting for analysis and screenshots...');
  await new Promise(r => setTimeout(r, 20000));
  
  // Check for screenshots
  const screenshotCount = await page.evaluate(() => {
    const screenshots = document.querySelectorAll('[class*="grid-cols-3"] > div');
    return screenshots.length;
  });
  console.log(`📸 Found ${screenshotCount} screenshots`);
  
  // Check profile section
  const profileData = await page.evaluate(() => {
    const scoreEl = document.querySelector('[class*="text-2xl"][class*="font-bold"]');
    return {
      hasScore: !!scoreEl,
      scoreText: scoreEl?.textContent || 'not found'
    };
  });
  console.log('👤 Profile data:', JSON.stringify(profileData));
  
  await page.screenshot({ path: '/tmp/korver_test.png', fullPage: true });
  console.log('✅ Full page screenshot saved to /tmp/korver_test.png');
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
