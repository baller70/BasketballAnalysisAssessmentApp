import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 8 with Kyle Korver Image...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Collect errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    // STEP 1: Go to front page
    console.log('📄 STEP 1: Loading front page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   ✅ Front page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot of front page
    await page.screenshot({ path: '/tmp/phase8_step1_frontpage.png', fullPage: true });
    console.log('   📸 Screenshot saved: /tmp/phase8_step1_frontpage.png');
    
    // STEP 2: Check if angle upload slots are visible
    console.log('\n📸 STEP 2: Checking upload slots...');
    const uploadSlots = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      const labels = Array.from(document.querySelectorAll('label')).filter(l => l.textContent?.includes('Angle'));
      return {
        fileInputCount: inputs.length,
        angleLabelCount: labels.length,
        labels: labels.map(l => l.textContent?.trim())
      };
    });
    console.log(`   Found ${uploadSlots.fileInputCount} file inputs`);
    console.log(`   Found ${uploadSlots.angleLabelCount} angle labels: ${uploadSlots.labels.join(', ')}`);
    
    // STEP 3: Upload Kyle Korver test image to 3 slots
    console.log('\n📸 STEP 3: Uploading Kyle Korver test image...');
    const testImagePath = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length >= 3) {
      for (let i = 0; i < 3; i++) {
        await fileInputs[i].uploadFile(testImagePath);
        console.log(`   ✅ Uploaded to slot ${i + 1}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    } else {
      console.log('   ⚠️ Not enough file inputs found');
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase8_step3_uploaded.png', fullPage: true });
    console.log('   📸 Screenshot saved: /tmp/phase8_step3_uploaded.png');
    
    // STEP 4: Click Analyze button
    console.log('\n🔬 STEP 4: Clicking Analyze button...');
    const analyzeBtn = await page.$('button:not([disabled])');
    const buttonText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = buttons.find(b => b.textContent?.includes('Analyze'));
      return analyzeBtn ? { text: analyzeBtn.textContent, disabled: analyzeBtn.disabled } : null;
    });
    console.log('   Button state:', buttonText);
    
    if (buttonText && !buttonText.disabled) {
      await page.click('button');
      console.log('   ✅ Clicked Analyze button');
    } else {
      // Try clicking by evaluating
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const analyzeBtn = buttons.find(b => b.textContent?.includes('Analyze'));
        if (analyzeBtn && !analyzeBtn.disabled) {
          analyzeBtn.click();
          return true;
        }
        return false;
      });
      console.log(clicked ? '   ✅ Clicked via evaluate' : '   ❌ Could not click');
    }
    
    // STEP 5: Wait for processing
    console.log('\n⏳ STEP 5: Waiting for processing...');
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if processing screen is showing
    let processingCount = 0;
    while (processingCount < 30) { // Max 150 seconds
      const url = page.url();
      if (url.includes('/results')) {
        console.log('   ✅ Navigated to results page!');
        break;
      }
      
      const isProcessing = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Analyzing') || text.includes('Detecting') || text.includes('Processing');
      });
      
      if (!isProcessing && processingCount > 2) {
        console.log('   Processing complete');
        break;
      }
      
      await new Promise(r => setTimeout(r, 5000));
      processingCount++;
      console.log(`   ... waiting (${processingCount * 5}s)`);
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // STEP 6: Navigate to results if not there
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/results')) {
      console.log('   Navigating to results page...');
      await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
    }
    
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/tmp/phase8_step6_results.png', fullPage: true });
    
    // STEP 7: Test Training Plan tab (Phase 8 - Drills)
    console.log('\n📋 STEP 7: Testing Training Plan Tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('TRAINING'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const trainingContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPersonalizedDrills: text.includes('Personalized Drills') || text.includes('Recommended Drills'),
        hasDrillCard: text.includes('min') || text.includes('Duration'),
        hasAddToPlan: text.includes('Add to Practice Plan'),
        hasMarkComplete: text.includes('Mark Complete') || text.includes('Completed')
      };
    });
    console.log('   Personalized Drills: ' + (trainingContent.hasPersonalizedDrills ? '✅' : '❌'));
    console.log('   Drill Cards: ' + (trainingContent.hasDrillCard ? '✅' : '❌'));
    console.log('   Add to Plan: ' + (trainingContent.hasAddToPlan ? '✅' : '❌'));
    console.log('   Mark Complete: ' + (trainingContent.hasMarkComplete ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_training.png', fullPage: true });
    
    // STEP 8: Test Identified Flaws tab (Phase 8 - Coaching Tips)
    console.log('\n🔍 STEP 8: Testing Identified Flaws Tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('IDENTIFIED FLAWS'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const flawsContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasCoachingTip: text.includes('COACHING TIP') || text.includes('Coaching Tip'),
        hasWhatINoticed: text.includes('What I Noticed'),
        hasWhyItMatters: text.includes('Why It Matters'),
        hasWhatToDo: text.includes('What To Do') || text.includes('Here\'s What To Do')
      };
    });
    console.log('   Coaching Tips: ' + (flawsContent.hasCoachingTip ? '✅' : '❌'));
    console.log('   What I Noticed: ' + (flawsContent.hasWhatINoticed ? '✅' : '❌'));
    console.log('   Why It Matters: ' + (flawsContent.hasWhyItMatters ? '✅' : '❌'));
    console.log('   What To Do: ' + (flawsContent.hasWhatToDo ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_flaws.png', fullPage: true });
    
    // STEP 9: Test Historical Data tab (Phase 8 - Weekly Summary)
    console.log('\n📊 STEP 9: Testing Historical Data Tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('HISTORICAL'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const historyContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasWeekInReview: text.includes('WEEK IN REVIEW') || text.includes('Week in Review'),
        hasKeyImprovements: text.includes('Key Improvements') || text.includes('KEY IMPROVEMENTS'),
        hasFocusArea: text.includes('Focus Area') || text.includes('FOCUS AREA'),
        hasWhatsWorking: text.includes("What's Working") || text.includes("WHAT'S WORKING")
      };
    });
    console.log('   Week In Review: ' + (historyContent.hasWeekInReview ? '✅' : '❌'));
    console.log('   Key Improvements: ' + (historyContent.hasKeyImprovements ? '✅' : '❌'));
    console.log('   Focus Area: ' + (historyContent.hasFocusArea ? '✅' : '❌'));
    console.log('   Whats Working: ' + (historyContent.hasWhatsWorking ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_historical.png', fullPage: true });
    
    // STEP 10: Test Player Assessment tab (Phase 8 - Motivational)
    console.log('\n🌟 STEP 10: Testing Player Assessment Tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('PLAYER ASSESSMENT'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const assessmentContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMotivational: text.includes('GREAT PROGRESS') || text.includes('KEEP GOING') || text.includes('MILESTONE'),
        hasEmoji: text.includes('🏆') || text.includes('📈') || text.includes('💪') || text.includes('⭐'),
        hasNextGoal: text.includes('Next Goal') || text.includes('NEXT GOAL')
      };
    });
    console.log('   Motivational Message: ' + (assessmentContent.hasMotivational ? '✅' : '❌'));
    console.log('   Emojis: ' + (assessmentContent.hasEmoji ? '✅' : '❌'));
    console.log('   Next Goal: ' + (assessmentContent.hasNextGoal ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_assessment.png', fullPage: true });
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ PHASE 8 TESTING COMPLETE');
    console.log('='.repeat(50));
    console.log('\nScreenshots saved to /tmp/phase8_*.png');
    
    if (errors.length > 0) {
      console.log('\n⚠️ Page errors:');
      errors.forEach(e => console.log('   ' + e));
    }
    
    console.log('\n🔍 Browser is open for manual verification...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/phase8_error.png', fullPage: true });
  }
  
  // Keep browser open
  await new Promise(() => {});
})();

