import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  console.log('🏀 Testing PHASE 8 - PROPER WAY (Upload Image First)...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  try {
    // STEP 1: Go to front page (upload page)
    console.log('📄 STEP 1: Going to front page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   ✅ Front page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // STEP 2: Upload Kyle Korver test image to Angle 1, 2, and 3 slots
    console.log('\n📸 STEP 2: Uploading Kyle Korver test image...');
    
    // The test image path
    const testImagePath = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    
    // Find the file inputs for angle slots
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`   Found ${fileInputs.length} file input(s)`);
    
    if (fileInputs.length >= 3) {
      // Upload to first 3 angle slots
      for (let i = 0; i < 3; i++) {
        await fileInputs[i].uploadFile(testImagePath);
        console.log(`   ✅ Uploaded to Angle ${i + 1}`);
        await new Promise(r => setTimeout(r, 500));
      }
    } else {
      console.log('   ⚠️ Not enough file inputs found, trying alternative method...');
      // Try to find by label
      const labels = await page.$$('label');
      for (const label of labels) {
        const text = await page.evaluate(el => el.textContent, label);
        if (text && text.includes('Angle')) {
          const input = await label.$('input[type="file"]');
          if (input) {
            await input.uploadFile(testImagePath);
            console.log(`   ✅ Uploaded via label: ${text}`);
          }
        }
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase8_upload.png', fullPage: true });
    console.log('   📸 Upload screenshot saved');
    
    // STEP 3: Click Analyze button
    console.log('\n🔬 STEP 3: Clicking Analyze button...');
    
    // Find and click the analyze button
    const analyzeClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = buttons.find(b => 
        b.textContent?.includes('Analyze') && !b.disabled
      );
      if (analyzeBtn) {
        analyzeBtn.click();
        return true;
      }
      return false;
    });
    
    if (analyzeClicked) {
      console.log('   ✅ Analyze button clicked');
    } else {
      console.log('   ⚠️ Analyze button not found or disabled');
      // Check if button is disabled
      const buttonState = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const analyzeBtn = buttons.find(b => b.textContent?.includes('Analyze'));
        return analyzeBtn ? { found: true, disabled: analyzeBtn.disabled, text: analyzeBtn.textContent } : { found: false };
      });
      console.log('   Button state:', buttonState);
    }
    
    // STEP 4: Wait for processing to complete
    console.log('\n⏳ STEP 4: Waiting for analysis to complete...');
    
    // Wait for navigation to results page or processing screen
    await new Promise(r => setTimeout(r, 5000));
    
    // Check if we're on processing screen
    let isProcessing = await page.evaluate(() => {
      return document.body.innerText.includes('Analyzing') || 
             document.body.innerText.includes('Processing') ||
             document.body.innerText.includes('Detecting');
    });
    
    if (isProcessing) {
      console.log('   🔄 Processing in progress...');
      // Wait for processing to complete (up to 90 seconds)
      for (let i = 0; i < 18; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const currentUrl = page.url();
        if (currentUrl.includes('/results')) {
          console.log('   ✅ Navigated to results page!');
          break;
        }
        const stillProcessing = await page.evaluate(() => {
          return document.body.innerText.includes('Analyzing') || 
                 document.body.innerText.includes('Processing');
        });
        if (!stillProcessing) {
          console.log('   ✅ Processing complete!');
          break;
        }
        console.log(`   ... still processing (${(i + 1) * 5}s)`);
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // If not on results page, navigate there
    if (!currentUrl.includes('/results')) {
      console.log('   Navigating to results page...');
      await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // STEP 5: Test Training Plan tab (Phase 8 - Personalized Drills)
    console.log('\n📋 STEP 5: Testing Training Plan Tab (Phase 8 Drills)...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const trainingBtn = buttons.find(b => b.textContent?.includes('TRAINING'));
      if (trainingBtn) trainingBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const trainingFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPersonalizedDrills: text.includes('Personalized Drills'),
        hasDrillCards: text.includes('⭐') || text.includes('Duration') || text.includes('min'),
        hasAddToPlan: text.includes('Add to Practice Plan'),
        hasMarkComplete: text.includes('Mark Complete'),
        hasLevelBadge: text.includes('Elementary') || text.includes('Middle School') || text.includes('High School') || text.includes('College') || text.includes('Professional')
      };
    });
    
    console.log('   Personalized Drills Section: ' + (trainingFeatures.hasPersonalizedDrills ? '✅' : '❌'));
    console.log('   Drill Cards with Details: ' + (trainingFeatures.hasDrillCards ? '✅' : '❌'));
    console.log('   Add to Plan Button: ' + (trainingFeatures.hasAddToPlan ? '✅' : '❌'));
    console.log('   Mark Complete Button: ' + (trainingFeatures.hasMarkComplete ? '✅' : '❌'));
    console.log('   Level Badge: ' + (trainingFeatures.hasLevelBadge ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_training.png', fullPage: true });
    
    // STEP 6: Test Identified Flaws tab (Phase 8 - Coaching Tips)
    console.log('\n🔍 STEP 6: Testing Identified Flaws Tab (Phase 8 Coaching Tips)...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const flawsBtn = buttons.find(b => b.textContent?.includes('IDENTIFIED FLAWS'));
      if (flawsBtn) flawsBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Expand a flaw card to see coaching tip
    await page.evaluate(() => {
      const expandBtns = Array.from(document.querySelectorAll('button'));
      // Find a flaw card expand button
      for (const btn of expandBtns) {
        if (btn.closest('[class*="flaw"]') || btn.closest('[class*="red"]')) {
          btn.click();
          break;
        }
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const flawsFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasCoachingTip: text.includes('Coaching Tip'),
        hasWhatINoticed: text.includes('What I Noticed'),
        hasWhyItMatters: text.includes('Why It Matters'),
        hasWhatToDo: text.includes('What To Do'),
        hasExpectedResult: text.includes('Expected Result')
      };
    });
    
    console.log('   Coaching Tip Section: ' + (flawsFeatures.hasCoachingTip ? '✅' : '❌'));
    console.log('   What I Noticed: ' + (flawsFeatures.hasWhatINoticed ? '✅' : '❌'));
    console.log('   Why It Matters: ' + (flawsFeatures.hasWhyItMatters ? '✅' : '❌'));
    console.log('   What To Do: ' + (flawsFeatures.hasWhatToDo ? '✅' : '❌'));
    console.log('   Expected Result: ' + (flawsFeatures.hasExpectedResult ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_flaws.png', fullPage: true });
    
    // STEP 7: Test Historical Data tab (Phase 8 - Weekly Summary)
    console.log('\n📊 STEP 7: Testing Historical Data Tab (Phase 8 Weekly Summary)...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const historyBtn = buttons.find(b => b.textContent?.includes('HISTORICAL'));
      if (historyBtn) historyBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const historyFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasWeekInReview: text.includes('Week in Review') || text.includes('Your Week'),
        hasKeyImprovements: text.includes('Key Improvements'),
        hasFocusAreas: text.includes('Focus Areas'),
        hasWhatsWorking: text.includes("What's Working"),
        hasNextWeekGoal: text.includes("Next Week") && text.includes('Goal')
      };
    });
    
    console.log('   Week In Review: ' + (historyFeatures.hasWeekInReview ? '✅' : '❌'));
    console.log('   Key Improvements: ' + (historyFeatures.hasKeyImprovements ? '✅' : '❌'));
    console.log('   Focus Areas: ' + (historyFeatures.hasFocusAreas ? '✅' : '❌'));
    console.log('   Whats Working: ' + (historyFeatures.hasWhatsWorking ? '✅' : '❌'));
    console.log('   Next Week Goal: ' + (historyFeatures.hasNextWeekGoal ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_historical.png', fullPage: true });
    
    // STEP 8: Test Player Assessment tab (Phase 8 - Motivational Messages)
    console.log('\n🌟 STEP 8: Testing Player Assessment Tab (Phase 8 Motivational Messages)...');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const assessmentBtn = buttons.find(b => b.textContent?.includes('PLAYER ASSESSMENT'));
      if (assessmentBtn) assessmentBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const assessmentFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMotivationalMessage: text.includes('KEEP GOING') || text.includes('GREAT PROGRESS') || text.includes('MILESTONE') || text.includes('ELITE PERFORMANCE'),
        hasNextGoal: text.includes('Next Goal'),
        hasEmoji: text.includes('🏆') || text.includes('📈') || text.includes('💪') || text.includes('⭐')
      };
    });
    
    console.log('   Motivational Message: ' + (assessmentFeatures.hasMotivationalMessage ? '✅' : '❌'));
    console.log('   Next Goal Section: ' + (assessmentFeatures.hasNextGoal ? '✅' : '❌'));
    console.log('   Emojis Present: ' + (assessmentFeatures.hasEmoji ? '✅' : '❌'));
    
    await page.screenshot({ path: '/tmp/phase8_assessment.png', fullPage: true });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ PHASE 8 TESTING COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n🔍 Browser is open - manually verify the features!');
    console.log('   Screenshots saved to /tmp/phase8_*.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/phase8_error.png', fullPage: true });
  }
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
})();

