import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 7: Results Dashboard & Presentation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Go directly to results page
    await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('✅ Results page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for Historical Data tab
    console.log('\n📊 Checking for Historical Data tab...');
    const tabs = await page.$$eval('button', buttons => 
      buttons.map(b => b.textContent).filter(t => t && t.includes('HISTORICAL'))
    );
    console.log(`   Historical Data tab: ${tabs.length > 0 ? '✅ Found' : '❌ Not found'}`);
    
    // Click Historical Data tab
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('HISTORICAL')) {
        await btn.click();
        console.log('✅ Historical Data tab clicked');
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase7_historical.png', fullPage: true });
    console.log('📸 Historical Data screenshot saved');
    
    // Check for Historical Data elements
    const hasHistoricalElements = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Historical Data'),
        hasTimeline: text.includes('Timeline') || text.includes('Session Timeline'),
        hasProgressStats: text.includes('Total Sessions') || text.includes('Average Score'),
        hasTrend: text.includes('Trend') || text.includes('Improving') || text.includes('Stable')
      };
    });
    
    console.log('\n📋 Historical Data Check:');
    console.log(`   Title: ${hasHistoricalElements.hasTitle ? '✅' : '❌'}`);
    console.log(`   Timeline: ${hasHistoricalElements.hasTimeline ? '✅' : '❌'}`);
    console.log(`   Progress Stats: ${hasHistoricalElements.hasProgressStats ? '✅' : '❌'}`);
    console.log(`   Trend Indicator: ${hasHistoricalElements.hasTrend ? '✅' : '❌'}`);
    
    // Now check Comparison tab for Photo Compare
    console.log('\n📸 Checking Photo Comparison feature...');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('COMPARISON')) {
        await btn.click();
        console.log('✅ Comparison tab clicked');
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Look for Photo Compare button
    const photoCompareBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent && b.textContent.includes('Photo Compare'));
    });
    console.log(`   Photo Compare button: ${photoCompareBtn ? '✅ Found' : '❌ Not found'}`);
    
    // Click Photo Compare if found
    const buttons2 = await page.$$('button');
    for (const btn of buttons2) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Photo Compare')) {
        await btn.click();
        console.log('✅ Photo Compare clicked');
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase7_photo_compare.png', fullPage: true });
    console.log('📸 Photo Compare screenshot saved');
    
    // Check for Photo Comparison elements
    const hasPhotoElements = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPhotoTitle: text.includes('Photo Comparison'),
        hasBeforeAfter: text.includes('Before') && text.includes('After'),
        hasTips: text.includes('What to Look For')
      };
    });
    
    console.log('\n📋 Photo Comparison Check:');
    console.log(`   Title: ${hasPhotoElements.hasPhotoTitle ? '✅' : '❌'}`);
    console.log(`   Before/After: ${hasPhotoElements.hasBeforeAfter ? '✅' : '❌'}`);
    console.log(`   Tips Section: ${hasPhotoElements.hasTips ? '✅' : '❌'}`);
    
    console.log('\n🔍 Browser is open - view Phase 7 features!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Keep browser open
  await new Promise(() => {});
})();
