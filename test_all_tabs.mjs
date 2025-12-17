import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing ALL TABS with Kyle Korver...');
  
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
  await new Promise(r => setTimeout(r, 18000));
  
  // Test each tab
  const tabsToTest = ['BIOMECHANICAL ANALYSIS', 'IDENTIFIED FLAWS', 'PLAYER ASSESSMENT', 'COMPARISON', 'TRAINING PLAN'];
  
  for (const tabName of tabsToTest) {
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes(tabName)) {
        await tab.click();
        console.log(`✅ Clicked ${tabName} tab`);
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
    
    // Take screenshot
    const filename = tabName.toLowerCase().replace(/ /g, '_');
    await page.screenshot({ path: `/tmp/tab_${filename}.png`, fullPage: true });
    console.log(`📸 Screenshot: /tmp/tab_${filename}.png`);
  }
  
  console.log('🔍 All tabs tested - browser is open');
  await new Promise(() => {});
})();
