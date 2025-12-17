import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing TOP 5 in COMPARISON TAB with Kyle Korver...');
  
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
  
  // Click on COMPARISON tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('COMPARISON')) {
      await tab.click();
      console.log('✅ Clicked COMPARISON tab');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/comparison_top5.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/comparison_top5.png');
  
  // Check for top 5 section
  const top5Info = await page.evaluate(() => {
    const text = document.body.innerText;
    
    // Look for the Top 5 title
    const hasTop5Title = text.includes('Top 5 Matched Shooters') || text.includes('Your Top 5');
    
    // Look for rank badges (#1, #2, #3, #4, #5)
    const hasRankBadges = text.includes('#1') && text.includes('#2') && text.includes('#3');
    
    // Count shooter cards with similarity percentages
    const percentageMatches = text.match(/\d+%/g) || [];
    
    return {
      hasTop5Title,
      hasRankBadges,
      percentageCount: percentageMatches.length,
      firstFewPercentages: percentageMatches.slice(0, 10)
    };
  });
  
  console.log('📊 Top 5 Info:', JSON.stringify(top5Info, null, 2));
  
  console.log('🔍 Browser is open - check the COMPARISON tab');
  await new Promise(() => {});
})();
