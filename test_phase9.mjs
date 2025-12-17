import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 9 - Progress Tracking & Historical Analysis...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // STEP 1: Go to front page and upload test image
    console.log('📄 STEP 1: Loading front page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   ✅ Front page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Upload Kyle Korver test image to 3 slots
    console.log('\n📸 STEP 2: Uploading Kyle Korver test image...');
    const testImagePath = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length >= 3) {
      for (let i = 0; i < 3; i++) {
        await fileInputs[i].uploadFile(testImagePath);
        console.log(`   ✅ Uploaded to slot ${i + 1}`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Click Analyze button
    console.log('\n🔬 STEP 3: Clicking Analyze button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = buttons.find(b => b.textContent?.includes('Analyze'));
      if (analyzeBtn && !analyzeBtn.disabled) analyzeBtn.click();
    });
    
    // Wait for processing
    console.log('\n⏳ STEP 4: Waiting for analysis...');
    let processingCount = 0;
    while (processingCount < 30) {
      await new Promise(r => setTimeout(r, 5000));
      const url = page.url();
      if (url.includes('/results')) {
        console.log('   ✅ Navigated to results page!');
        break;
      }
      processingCount++;
      console.log(`   ... waiting (${processingCount * 5}s)`);
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Navigate to results if not there
    if (!page.url().includes('/results')) {
      await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // STEP 5: Go to Historical Data tab
    console.log('\n📊 STEP 5: Testing Historical Data Tab (Phase 9)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('HISTORICAL'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase9_historical_overview.png', fullPage: true });
    
    // Check for Phase 9 view mode tabs
    const phase9Features = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasOverviewTab: text.includes('Overview'),
        hasCategoryBreakdownTab: text.includes('Category Breakdown'),
        hasIssueAnalysisTab: text.includes('Issue Analysis'),
        hasAchievementsTab: text.includes('Achievements'),
        hasDateRange: text.includes('7 days') || text.includes('30 days') || text.includes('90 days'),
        hasTotalSessions: text.includes('Total Sessions'),
        hasAverageScore: text.includes('Average Score'),
        hasProgress: text.includes('Progress'),
        hasTrend: text.includes('Trend')
      };
    });
    
    console.log('   Overview Tab: ' + (phase9Features.hasOverviewTab ? '✅' : '❌'));
    console.log('   Category Breakdown Tab: ' + (phase9Features.hasCategoryBreakdownTab ? '✅' : '❌'));
    console.log('   Issue Analysis Tab: ' + (phase9Features.hasIssueAnalysisTab ? '✅' : '❌'));
    console.log('   Achievements Tab: ' + (phase9Features.hasAchievementsTab ? '✅' : '❌'));
    console.log('   Total Sessions: ' + (phase9Features.hasTotalSessions ? '✅' : '❌'));
    console.log('   Average Score: ' + (phase9Features.hasAverageScore ? '✅' : '❌'));
    console.log('   Progress: ' + (phase9Features.hasProgress ? '✅' : '❌'));
    console.log('   Trend: ' + (phase9Features.hasTrend ? '✅' : '❌'));
    
    // STEP 6: Test Category Breakdown view
    console.log('\n📊 STEP 6: Testing Category Breakdown view...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Category Breakdown'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase9_categories.png', fullPage: true });
    
    const categoryFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasElbowAlignment: text.includes('Elbow Alignment'),
        hasKneeBend: text.includes('Knee Bend'),
        hasReleaseAngle: text.includes('Release Angle'),
        hasImproved: text.includes('Improved'),
        hasStable: text.includes('Stable'),
        hasDeclined: text.includes('Declined')
      };
    });
    
    console.log('   Elbow Alignment: ' + (categoryFeatures.hasElbowAlignment ? '✅' : '❌'));
    console.log('   Knee Bend: ' + (categoryFeatures.hasKneeBend ? '✅' : '❌'));
    console.log('   Release Angle: ' + (categoryFeatures.hasReleaseAngle ? '✅' : '❌'));
    console.log('   Legend (Improved/Stable/Declined): ' + (
      (categoryFeatures.hasImproved || categoryFeatures.hasStable || categoryFeatures.hasDeclined) ? '✅' : '❌'
    ));
    
    // STEP 7: Test Issue Analysis view
    console.log('\n🔍 STEP 7: Testing Issue Analysis view...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Issue Analysis'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase9_issues.png', fullPage: true });
    
    const issueFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasIssueFrequency: text.includes('Issue Frequency') || text.includes('No issues detected'),
        hasHeatmap: text.includes('High') || text.includes('Medium') || text.includes('Low'),
        hasTip: text.includes('Tip') || text.includes('Focus')
      };
    });
    
    console.log('   Issue Frequency Analysis: ' + (issueFeatures.hasIssueFrequency ? '✅' : '❌'));
    console.log('   Severity Legend: ' + (issueFeatures.hasHeatmap ? '✅' : '❌'));
    console.log('   Tip Section: ' + (issueFeatures.hasTip ? '✅' : '❌'));
    
    // STEP 8: Test Achievements view
    console.log('\n🏆 STEP 8: Testing Achievements view...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Achievements'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase9_milestones.png', fullPage: true });
    
    const milestoneFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasAchievementsUnlocked: text.includes('Achievements Unlocked'),
        hasLockedAchievements: text.includes('Locked Achievements'),
        hasNextAchievement: text.includes('Next Achievement'),
        hasFirstAnalysis: text.includes('First Analysis'),
        hasMilestoneIcons: text.includes('🎯') || text.includes('⭐') || text.includes('🏆')
      };
    });
    
    console.log('   Achievements Unlocked: ' + (milestoneFeatures.hasAchievementsUnlocked ? '✅' : '❌'));
    console.log('   Locked Achievements: ' + (milestoneFeatures.hasLockedAchievements ? '✅' : '❌'));
    console.log('   Next Achievement: ' + (milestoneFeatures.hasNextAchievement ? '✅' : '❌'));
    console.log('   First Analysis Badge: ' + (milestoneFeatures.hasFirstAnalysis ? '✅' : '❌'));
    console.log('   Milestone Icons: ' + (milestoneFeatures.hasMilestoneIcons ? '✅' : '❌'));
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ PHASE 9 TESTING COMPLETE');
    console.log('='.repeat(50));
    console.log('\nScreenshots saved to /tmp/phase9_*.png');
    console.log('\n🔍 Browser is open for manual verification...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/phase9_error.png', fullPage: true });
  }
  
  // Keep browser open
  await new Promise(() => {});
})();

