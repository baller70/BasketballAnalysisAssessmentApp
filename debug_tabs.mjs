import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1500, height: 1000 } });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
  console.log('✅ Page loaded');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Find all tab buttons
  const tabButtons = await page.$$eval('button', buttons => {
    return buttons
      .filter(b => ['BIOMECHANICAL', 'IDENTIFIED', 'PLAYER', 'COMPARISON', 'TRAINING', 'HISTORICAL'].some(t => b.textContent?.includes(t)))
      .map(b => ({ text: b.textContent, className: b.className }));
  });
  
  console.log('\n📋 Tab Buttons Found:');
  tabButtons.forEach(t => console.log(`   - ${t.text} (active: ${t.className.includes('FFD700')})`));
  
  // Click HISTORICAL DATA tab using evaluate
  console.log('\n🖱️ Clicking HISTORICAL DATA tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const histBtn = buttons.find(b => b.textContent?.includes('HISTORICAL'));
    if (histBtn) {
      histBtn.click();
      console.log('Clicked!');
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Check which tab is now active
  const activeTab = await page.$$eval('button', buttons => {
    const activeBtn = buttons.find(b => 
      ['BIOMECHANICAL', 'IDENTIFIED', 'PLAYER', 'COMPARISON', 'TRAINING', 'HISTORICAL'].some(t => b.textContent?.includes(t)) &&
      b.className.includes('FFD700')
    );
    return activeBtn?.textContent || 'none';
  });
  
  console.log(`\n✅ Active tab after click: ${activeTab}`);
  
  // Check for Historical Data Section content
  const hasHistContent = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHistoricalData: text.includes('Historical Data'),
      hasTrackProgress: text.includes('Track your shooting progress'),
      hasSessionTimeline: text.includes('Session Timeline'),
      hasTotalSessions: text.includes('Total Sessions'),
      hasNoSessionData: text.includes('No session data available')
    };
  });
  
  console.log('\n📋 Historical Data Section Content:');
  Object.entries(hasHistContent).forEach(([key, val]) => {
    console.log(`   ${key}: ${val ? '✅' : '❌'}`);
  });
  
  console.log('\n🔍 Browser open - check the tabs!');
  await new Promise(() => {});
})();
