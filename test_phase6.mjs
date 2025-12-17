import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 6: Comparison & Coaching Levels...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('✅ Home page loaded');
    
    // Use Kyle Korver test image
    const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    
    if (fileInput) {
      await fileInput.uploadFile(testImage);
      console.log('✅ Kyle Korver image uploaded');
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Fill in player profile for better matching
    console.log('📝 Filling player profile...');
    
    // Try to find and fill height field
    const heightInput = await page.$('input[placeholder*="height" i], input[name*="height" i]');
    if (heightInput) {
      await heightInput.type("6'2");
      console.log('   Height: 6\'2"');
    }
    
    // Try to find and fill age field
    const ageInput = await page.$('input[placeholder*="age" i], input[name*="age" i]');
    if (ageInput) {
      await ageInput.type('25');
      console.log('   Age: 25');
    }
    
    // Click Analyze button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Analyze')) {
        await btn.click();
        console.log('✅ Analyze button clicked');
        break;
      }
    }
    
    // Wait for results page
    console.log('⏳ Waiting for analysis to complete...');
    await page.waitForFunction(
      () => window.location.pathname.includes('/results'),
      { timeout: 90000 }
    );
    console.log('✅ Results page loaded');
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Navigate to Comparison tab
    console.log('📊 Navigating to Comparison tab...');
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
    
    // Take screenshot of Phase 6 Comparison
    await page.screenshot({ path: '/tmp/phase6_comparison.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/phase6_comparison.png');
    
    // Check for Phase 6 elements
    const hasPhase6Elements = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPersonalizedComparison: text.includes('Personalized Shooter Comparison') || text.includes('Body-Type Match'),
        hasTopMatches: text.includes('Top 5 Similar Shooters') || text.includes('Similar Shooters'),
        hasOptimalMechanics: text.includes('Optimal Mechanics'),
        hasCoachingFeedback: text.includes('Coaching Feedback') || text.includes('Coaching Tips'),
        hasDrills: text.includes('Recommended Drills'),
        hasAgeGroup: text.includes('ELEMENTARY') || text.includes('MIDDLE_SCHOOL') || text.includes('HIGH_SCHOOL') || text.includes('COLLEGE') || text.includes('PROFESSIONAL')
      };
    });
    
    console.log('\n📋 Phase 6 Elements Check:');
    console.log(`   Personalized Comparison: ${hasPhase6Elements.hasPersonalizedComparison ? '✅' : '❌'}`);
    console.log(`   Top 5 Matches: ${hasPhase6Elements.hasTopMatches ? '✅' : '❌'}`);
    console.log(`   Optimal Mechanics: ${hasPhase6Elements.hasOptimalMechanics ? '✅' : '❌'}`);
    console.log(`   Coaching Feedback: ${hasPhase6Elements.hasCoachingFeedback ? '✅' : '❌'}`);
    console.log(`   Recommended Drills: ${hasPhase6Elements.hasDrills ? '✅' : '❌'}`);
    console.log(`   Age Group Detection: ${hasPhase6Elements.hasAgeGroup ? '✅' : '❌'}`);
    
    console.log('\n🔍 Browser is open - view the Phase 6 Comparison tab!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Keep browser open
  await new Promise(() => {});
})();
