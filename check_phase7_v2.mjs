import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
  
  // Click Historical Data tab
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('HISTORICAL')) {
      await btn.click();
      console.log('✅ Clicked HISTORICAL DATA tab');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Check for specific elements
  const elements = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      // Historical Data Section
      hasHistoricalTitle: text.includes('Historical Data'),
      hasSessionTimeline: text.includes('Session Timeline'),
      hasTotalSessions: text.includes('Total Sessions'),
      hasAverageScore: text.includes('Average Score'),
      hasProgress: text.includes('Progress'),
      hasTrend: text.includes('Trend'),
      hasNoData: text.includes('No session data') || text.includes('No sessions'),
      
      // Check for the timeline chart
      hasTimelineChart: text.includes('Timeline'),
      
      // Full text for debugging
      snippet: text.substring(text.indexOf('HISTORICAL'), text.indexOf('HISTORICAL') + 1500)
    };
  });
  
  console.log('\n📋 Historical Data Elements:');
  console.log(`   Historical Data title: ${elements.hasHistoricalTitle ? '✅' : '❌'}`);
  console.log(`   Session Timeline: ${elements.hasSessionTimeline ? '✅' : '❌'}`);
  console.log(`   Total Sessions: ${elements.hasTotalSessions ? '✅' : '❌'}`);
  console.log(`   Average Score: ${elements.hasAverageScore ? '✅' : '❌'}`);
  console.log(`   Progress stat: ${elements.hasProgress ? '✅' : '❌'}`);
  console.log(`   Trend indicator: ${elements.hasTrend ? '✅' : '❌'}`);
  console.log(`   No data message: ${elements.hasNoData ? '✅ (expected if no sessions)' : '❌'}`);
  
  console.log('\n📝 Text snippet after HISTORICAL:');
  console.log(elements.snippet);
  
  // Now check Comparison tab
  console.log('\n\n=== Checking Comparison Tab ===');
  const buttons2 = await page.$$('button');
  for (const btn of buttons2) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.toUpperCase().includes('COMPARISON') && !text.includes('Photo')) {
      await btn.click();
      console.log('✅ Clicked COMPARISON tab');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Check for Photo Compare button
  const compElements = await page.evaluate(() => {
    const text = document.body.innerText;
    const buttons = Array.from(document.querySelectorAll('button'));
    const buttonTexts = buttons.map(b => b.textContent).filter(Boolean);
    
    return {
      hasBodyTypeMatch: text.includes('Body-Type Match'),
      hasEliteShooters: text.includes('Elite Shooters'),
      hasPhotoCompare: text.includes('Photo Compare'),
      buttonTexts: buttonTexts.slice(0, 20)
    };
  });
  
  console.log('\n📋 Comparison Tab Elements:');
  console.log(`   Body-Type Match: ${compElements.hasBodyTypeMatch ? '✅' : '❌'}`);
  console.log(`   Elite Shooters: ${compElements.hasEliteShooters ? '✅' : '❌'}`);
  console.log(`   Photo Compare: ${compElements.hasPhotoCompare ? '✅' : '❌'}`);
  console.log('\n   Button texts:', compElements.buttonTexts.join(', '));
  
  await browser.close();
})();
