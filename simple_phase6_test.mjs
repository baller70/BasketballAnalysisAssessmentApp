import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing Phase 6 Comparison...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  // Go directly to results page
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
  console.log('✅ Results page loaded');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Comparison tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && (text.includes('COMPARISON') || text.includes('Comparison'))) {
      await tab.click();
      console.log('✅ Comparison tab clicked');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/phase6_test.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  // Check for Phase 6 elements
  const pageText = await page.evaluate(() => document.body.innerText);
  
  console.log('\n📋 Phase 6 Check:');
  console.log(`   Body-Type Match toggle: ${pageText.includes('Body-Type Match') ? '✅' : '❌'}`);
  console.log(`   Elite Shooters toggle: ${pageText.includes('Elite Shooters') ? '✅' : '❌'}`);
  console.log(`   Personalized Comparison: ${pageText.includes('Personalized') ? '✅' : '❌'}`);
  
  console.log('\n🔍 Browser open - check Comparison tab!');
  await new Promise(() => {});
})();
