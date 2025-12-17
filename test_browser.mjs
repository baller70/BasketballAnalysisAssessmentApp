import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting browser test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 900 }
  });
  
  const page = await browser.newPage();
  
  console.log('📍 Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/tmp/step1_home.png' });
  console.log('✅ Step 1: Home page loaded');
  
  const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/shooter1.jpg';
  
  console.log('📤 Uploading test image...');
  
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testImage);
    console.log('✅ File uploaded');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/step2_uploaded.png' });
  } else {
    console.log('❌ Could not find file input');
  }
  
  console.log('🔍 Looking for Analyze button...');
  await new Promise(r => setTimeout(r, 1000));
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Analyze')) {
      console.log('✅ Found Analyze button, clicking...');
      await btn.click();
      break;
    }
  }
  
  console.log('⏳ Waiting for analysis...');
  await new Promise(r => setTimeout(r, 15000));
  await page.screenshot({ path: '/tmp/step3_results.png' });
  
  const url = page.url();
  console.log('📍 Current URL:', url);
  
  await page.screenshot({ path: '/tmp/step4_final.png', fullPage: true });
  console.log('✅ Screenshots saved to /tmp/');
  
  console.log('🔍 Browser is open - check the window');
  
  await new Promise(() => {});
})();
