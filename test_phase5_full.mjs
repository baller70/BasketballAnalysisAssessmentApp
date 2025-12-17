import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 5: Full 7-Stage Processing Experience...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
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
  
  // Click Analyze button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Analyze')) {
      await btn.click();
      console.log('✅ Analyze button clicked - Watch all 7 stages complete!');
      console.log('');
      console.log('📊 Stage Durations:');
      console.log('   1. Analyzing Upload Quality:     5 seconds');
      console.log('   2. Detecting Body Position:     10 seconds');
      console.log('   3. Measuring Shooting Angles:   10 seconds');
      console.log('   4. Analyzing Shooting Form:     15 seconds');
      console.log('   5. Comparing to Optimal Form:   10 seconds');
      console.log('   6. Generating Recommendations:  10 seconds');
      console.log('   7. Finalizing Your Analysis:     5 seconds');
      console.log('   ─────────────────────────────────────────');
      console.log('   Total Time: ~65 seconds');
      console.log('');
      break;
    }
  }
  
  // Monitor progress
  let lastStage = '';
  const startTime = Date.now();
  
  const checkProgress = async () => {
    const stageInfo = await page.evaluate(() => {
      const stages = document.querySelectorAll('[class*="rounded-lg"]');
      for (const stage of stages) {
        const text = stage.textContent || '';
        if (text.includes('Analyzing Upload Quality') || 
            text.includes('Detecting Body Position') ||
            text.includes('Measuring Shooting Angles') ||
            text.includes('Analyzing Shooting Form') ||
            text.includes('Comparing to Optimal') ||
            text.includes('Generating Personalized') ||
            text.includes('Finalizing Your Analysis')) {
          // Check if this stage has a spinner (currently active)
          const hasSpinner = stage.querySelector('[class*="animate-spin"]');
          if (hasSpinner) {
            return text.split('\n')[0];
          }
        }
      }
      return null;
    });
    
    if (stageInfo && stageInfo !== lastStage) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`⏱️ [${elapsed}s] Current stage: ${stageInfo}`);
      lastStage = stageInfo;
    }
  };
  
  // Check progress every 2 seconds
  const progressInterval = setInterval(checkProgress, 2000);
  
  // Wait for results page (URL change)
  await page.waitForFunction(
    () => window.location.pathname.includes('/results'),
    { timeout: 120000 }
  );
  
  clearInterval(progressInterval);
  
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log('');
  console.log(`✅ All 7 stages completed in ${totalTime} seconds!`);
  console.log('✅ Now on results page');
  
  // Take screenshot of results
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/phase5_results.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/phase5_results.png');
  
  console.log('\n🔍 Browser is open - view the results!');
  await new Promise(() => {});
})();
