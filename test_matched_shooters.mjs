import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing TOP 5 MATCHED SHOOTERS with Kyle Korver...');
  
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
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Scroll down to see matched shooters
  await page.evaluate(() => {
    window.scrollBy(0, 1000);
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/matched_shooters.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/matched_shooters.png');
  
  // Check for matched shooters section
  const hasMatchedShooters = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasTitle: text.includes('Top 5 Matched Shooters'),
      hasShooterNames: text.includes('Stephen Curry') || text.includes('Kyle Korver') || text.includes('Ray Allen'),
      hasMatchPercentage: /%\s*Match/.test(text) || /\d+%/.test(text),
      hasSkillLevels: text.includes('ELITE') || text.includes('PRO') || text.includes('ADVANCED')
    };
  });
  
  console.log('📊 Matched Shooters check:', JSON.stringify(hasMatchedShooters, null, 2));
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
