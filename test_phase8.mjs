import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 8: Recommendations & Coaching System...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Go to results page
    await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('✅ Results page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 1: Check Training Plan tab for personalized drills
    console.log('\n📋 Testing Training Plan Tab...');
    
    // Click Training Plan tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const trainingBtn = buttons.find(b => b.textContent?.includes('TRAINING'));
      if (trainingBtn) trainingBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for personalized drills section
    const hasPersonalizedDrills = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Personalized Drills'),
        hasDrillCards: text.includes('Elbow') || text.includes('Knee') || text.includes('Follow-Through'),
        hasStars: text.includes('⭐'),
        hasAddToPlan: text.includes('Add to Practice Plan'),
        hasMarkComplete: text.includes('Mark Complete')
      };
    });
    
    console.log('   Personalized Drills Title: ' + (hasPersonalizedDrills.hasTitle ? '✅' : '❌'));
    console.log('   Drill Cards Present: ' + (hasPersonalizedDrills.hasDrillCards ? '✅' : '❌'));
    console.log('   Difficulty Stars: ' + (hasPersonalizedDrills.hasStars ? '✅' : '❌'));
    console.log('   Add to Plan Button: ' + (hasPersonalizedDrills.hasAddToPlan ? '✅' : '❌'));
    console.log('   Mark Complete Button: ' + (hasPersonalizedDrills.hasMarkComplete ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_training.png', fullPage: true });
    console.log('📸 Training Plan screenshot saved');
    
    // Test 2: Check Identified Flaws tab for coaching tips
    console.log('\n🔍 Testing Identified Flaws Tab...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const flawsBtn = buttons.find(b => b.textContent?.includes('IDENTIFIED FLAWS'));
      if (flawsBtn) flawsBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for coaching tip section
    const hasCoachingTips = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasCoachingTip: text.includes('Coaching Tip'),
        hasWhatINoticed: text.includes('What I Noticed') || text.includes('noticed'),
        hasWhyItMatters: text.includes('Why It Matters') || text.includes('matters'),
        hasWhatToDo: text.includes('What To Do') || text.includes('to do'),
        hasExpectedResult: text.includes('Expected Result') || text.includes('expected')
      };
    });
    
    console.log('   Coaching Tip Section: ' + (hasCoachingTips.hasCoachingTip ? '✅' : '❌'));
    console.log('   What I Noticed: ' + (hasCoachingTips.hasWhatINoticed ? '✅' : '❌'));
    console.log('   Why It Matters: ' + (hasCoachingTips.hasWhyItMatters ? '✅' : '❌'));
    console.log('   What To Do: ' + (hasCoachingTips.hasWhatToDo ? '✅' : '❌'));
    console.log('   Expected Result: ' + (hasCoachingTips.hasExpectedResult ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_flaws.png', fullPage: true });
    console.log('📸 Identified Flaws screenshot saved');
    
    // Test 3: Check Historical Data tab for weekly summary
    console.log('\n📊 Testing Historical Data Tab...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const historyBtn = buttons.find(b => b.textContent?.includes('HISTORICAL'));
      if (historyBtn) historyBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for weekly performance summary
    const hasWeeklySummary = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasWeekInReview: text.includes('Week in Review') || text.includes('Your Week'),
        hasKeyImprovements: text.includes('Key Improvements') || text.includes('Improvements'),
        hasFocusAreas: text.includes('Focus Areas') || text.includes('Focus Area'),
        hasWhatsWorking: text.includes("What's Working") || text.includes('Working'),
        hasNextWeekGoal: text.includes("Next Week") || text.includes('Goal')
      };
    });
    
    console.log('   Week In Review: ' + (hasWeeklySummary.hasWeekInReview ? '✅' : '❌'));
    console.log('   Key Improvements: ' + (hasWeeklySummary.hasKeyImprovements ? '✅' : '❌'));
    console.log('   Focus Areas: ' + (hasWeeklySummary.hasFocusAreas ? '✅' : '❌'));
    console.log('   Whats Working: ' + (hasWeeklySummary.hasWhatsWorking ? '✅' : '❌'));
    console.log('   Next Week Goal: ' + (hasWeeklySummary.hasNextWeekGoal ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_historical.png', fullPage: true });
    console.log('📸 Historical Data screenshot saved');
    
    // Test 4: Check Player Assessment tab for motivational messages
    console.log('\n🌟 Testing Player Assessment Tab...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const assessmentBtn = buttons.find(b => b.textContent?.includes('PLAYER ASSESSMENT'));
      if (assessmentBtn) assessmentBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for motivational messages
    const hasMotivational = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMotivationalMessage: text.includes('KEEP GOING') || text.includes('GREAT PROGRESS') || text.includes('MILESTONE') || text.includes('ELITE'),
        hasNextGoal: text.includes('Next Goal'),
        hasEmoji: text.includes('🏆') || text.includes('📈') || text.includes('💪') || text.includes('⭐')
      };
    });
    
    console.log('   Motivational Message: ' + (hasMotivational.hasMotivationalMessage ? '✅' : '❌'));
    console.log('   Next Goal Section: ' + (hasMotivational.hasNextGoal ? '✅' : '❌'));
    console.log('   Emojis Present: ' + (hasMotivational.hasEmoji ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_assessment.png', fullPage: true });
    console.log('📸 Player Assessment screenshot saved');
    
    console.log('\n✅ PHASE 8 Testing Complete!');
    console.log('🔍 Browser is open - review the tabs manually!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
})();

