import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 5: Processing Experience with Kyle Korver...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
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
  
  // Take screenshot of home page with uploaded image
  await page.screenshot({ path: '/tmp/phase5_1_upload.png' });
  console.log('📸 Screenshot 1: Upload page saved');
  
  // Click Analyze button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Analyze')) {
      await btn.click();
      console.log('✅ Analyze button clicked - Starting 7-stage processing...');
      break;
    }
  }
  
  // Wait a moment for the progress screen to appear
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot of Stage 1
  await page.screenshot({ path: '/tmp/phase5_2_stage1.png' });
  console.log('📸 Screenshot 2: Stage 1 - Analyzing Upload Quality');
  
  // Wait and capture more stages
  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({ path: '/tmp/phase5_3_stage2.png' });
  console.log('📸 Screenshot 3: Stage 2 - Detecting Body Position');
  
  await new Promise(r => setTimeout(r, 12000));
  await page.screenshot({ path: '/tmp/phase5_4_stage3.png' });
  console.log('📸 Screenshot 4: Stage 3/4 - Measuring Angles / Analyzing Form');
  
  await new Promise(r => setTimeout(r, 15000));
  await page.screenshot({ path: '/tmp/phase5_5_stage5.png' });
  console.log('📸 Screenshot 5: Stage 5/6 - Comparing / Recommendations');
  
  // Wait for completion and results page
  await new Promise(r => setTimeout(r, 20000));
  await page.screenshot({ path: '/tmp/phase5_6_results.png', fullPage: true });
  console.log('📸 Screenshot 6: Results page');
  
  console.log('\n🔍 Browser is open - watch the 7-stage processing animation!');
  console.log('📊 Screenshots saved to /tmp/phase5_*.png');
  
  // Keep browser open for viewing
  await new Promise(() => {});
})();
