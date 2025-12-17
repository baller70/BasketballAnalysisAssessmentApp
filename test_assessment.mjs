import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PLAYER ASSESSMENT with Kyle Korver...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🏀') || text.includes('✅') || text.includes('Score') || text.includes('angles')) {
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
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Get assessment info
  const assessmentInfo = await page.evaluate(() => {
    // Get shooter level
    const levelEl = document.querySelector('[class*="text-2xl"][class*="font-black"]');
    const level = levelEl ? levelEl.textContent : 'Not found';
    
    // Get skills
    const skillEls = document.querySelectorAll('[class*="bg-\\[\\#2a2a2a\\]"] [class*="font-medium"]');
    const skills = Array.from(skillEls).map(el => el.textContent).slice(0, 8);
    
    // Get SPAR stats
    const sparStats = document.querySelectorAll('[class*="text-lg"][class*="font-bold"][class*="text-white"]');
    const sparValues = Array.from(sparStats).map(el => el.textContent);
    
    return { level, skills, sparValues };
  });
  console.log('📊 Assessment info:', JSON.stringify(assessmentInfo, null, 2));
  
  await page.screenshot({ path: '/tmp/assessment_test.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/assessment_test.png');
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
