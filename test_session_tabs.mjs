import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing SESSION FILTERING in ALL TABS with Kyle Korver...');
  
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
  
  // Test each tab for session dropdown
  const tabNames = ['BIOMECHANICAL ANALYSIS', 'IDENTIFIED FLAWS', 'PLAYER ASSESSMENT', 'COMPARISON', 'TRAINING PLAN'];
  
  for (const tabName of tabNames) {
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
    
    // Check for session dropdown
    const hasDropdown = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const options = Array.from(select.options).map(o => o.text);
        if (options.some(o => o.includes('Session') || o.includes('Current') || o.includes('Live'))) {
          return { found: true, options: options.slice(0, 5) };
        }
      }
      return { found: false, options: [] };
    });
    
    console.log(`📊 ${tabName}: Session Dropdown ${hasDropdown.found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (hasDropdown.found) {
      console.log(`   Options: ${hasDropdown.options.join(', ')}`);
    }
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/session_tabs.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/session_tabs.png');
  
  console.log('\n🔍 Browser is open - check all tabs for session dropdowns');
  await new Promise(() => {});
})();
