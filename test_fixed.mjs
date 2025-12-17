import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing Fixed 7-Stage Processing (~32 seconds total)...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('✅ Home page loaded');
    
    // Use Kyle Korver test image
    const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    
    if (fileInput) {
      await fileInput.uploadFile(testImage);
      console.log('✅ Kyle Korver image uploaded');
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Click Analyze button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Analyze')) {
        await btn.click();
        console.log('✅ Analyze button clicked');
        console.log('');
        console.log('📊 Stage Durations (Total ~32 seconds):');
        console.log('   1. Analyzing Upload Quality:     3s');
        console.log('   2. Detecting Body Position:      5s');
        console.log('   3. Measuring Shooting Angles:    5s');
        console.log('   4. Analyzing Shooting Form:      6s');
        console.log('   5. Comparing to Optimal Form:    5s');
        console.log('   6. Generating Recommendations:   5s');
        console.log('   7. Finalizing Your Analysis:     3s');
        console.log('');
        break;
      }
    }
    
    // Wait for results page
    const startTime = Date.now();
    await page.waitForFunction(
      () => window.location.pathname.includes('/results'),
      { timeout: 90000 }
    );
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ All 7 stages completed in ${totalTime} seconds!`);
    console.log('✅ Now on results page');
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/fixed_results.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🔍 Browser is open - view the results!');
  await new Promise(() => {});
})();
