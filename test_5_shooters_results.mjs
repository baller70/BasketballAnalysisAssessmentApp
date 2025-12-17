import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing TOP 5 MATCHED SHOOTERS on RESULTS PAGE...');
  
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
  
  // Take screenshot of results page (should show top 5 matched shooters)
  await page.screenshot({ path: '/tmp/results_5_shooters.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/results_5_shooters.png');
  
  // Check for the 5 matched shooters
  const shooterInfo = await page.evaluate(() => {
    const text = document.body.innerText;
    
    return {
      hasStephenCurry: text.includes('Stephen Curry') || text.includes('STEPHEN CURRY'),
      hasKyleKorver: text.includes('Kyle Korver'),
      hasRayAllen: text.includes('Ray Allen'),
      hasKlayThompson: text.includes('Klay Thompson'),
      hasDevinBooker: text.includes('Devin Booker'),
      hasMatchedEliteShooter: text.includes('Matched Elite Shooter') || text.includes('MATCHED ELITE SHOOTER'),
      // Count rank badges
      hasRank2: text.includes('2'),
      hasRank3: text.includes('3'),
      hasRank4: text.includes('4'),
      hasRank5: text.includes('5'),
    };
  });
  
  console.log('📊 5 Matched Shooters Check:', JSON.stringify(shooterInfo, null, 2));
  
  console.log('🔍 Browser is open - check the RESULTS page for 5 matched shooters');
  await new Promise(() => {});
})();
