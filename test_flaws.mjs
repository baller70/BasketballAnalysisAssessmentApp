import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing FLAWS DETECTION with Kyle Korver...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🏀') || text.includes('✅') || text.includes('Flaw') || text.includes('angles')) {
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
  
  // Wait for analysis
  console.log('⏳ Waiting for analysis...');
  await new Promise(r => setTimeout(r, 18000));
  
  // Click on IDENTIFIED FLAWS tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('IDENTIFIED FLAWS')) {
      await tab.click();
      console.log('✅ Clicked IDENTIFIED FLAWS tab');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Get flaws info
  const flawsInfo = await page.evaluate(() => {
    const flawCards = document.querySelectorAll('[class*="from-red-500"]');
    const flawTitles = Array.from(document.querySelectorAll('h3')).map(h => h.textContent);
    return {
      cardCount: flawCards.length,
      titles: flawTitles.filter(t => t && t.length < 50)
    };
  });
  console.log('📊 Flaws info:', JSON.stringify(flawsInfo, null, 2));
  
  await page.screenshot({ path: '/tmp/flaws_test.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/flaws_test.png');
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
