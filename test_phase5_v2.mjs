import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 5: Full 7-Stage Processing Experience...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('✅ Home page loaded');
    
    // Use OFFICIAL Kyle Korver test image
    const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    
    // Wait for file input to be present
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    
    if (fileInput) {
      await fileInput.uploadFile(testImage);
      console.log('✅ Kyle Korver image uploaded');
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log('❌ File input not found');
      return;
    }
    
    // Click Analyze button
    const analyzeButton = await page.waitForSelector('button:has-text("Analyze")', { timeout: 5000 }).catch(() => null);
    
    if (!analyzeButton) {
      // Find button by text content
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Analyze')) {
          await btn.click();
          console.log('✅ Analyze button clicked');
          console.log('');
          console.log('📊 Watch all 7 stages complete (~65 seconds total):');
          console.log('   1. Analyzing Upload Quality (5s)');
          console.log('   2. Detecting Body Position (10s)');
          console.log('   3. Measuring Shooting Angles (10s)');
          console.log('   4. Analyzing Shooting Form (15s)');
          console.log('   5. Comparing to Optimal Form (10s)');
          console.log('   6. Generating Recommendations (10s)');
          console.log('   7. Finalizing Your Analysis (5s)');
          console.log('');
          break;
        }
      }
    } else {
      await analyzeButton.click();
      console.log('✅ Analyze button clicked');
    }
    
    // Wait for progress screen
    await new Promise(r => setTimeout(r, 2000));
    
    // Monitor stages
    const startTime = Date.now();
    let lastStage = '';
    
    const checkStage = async () => {
      try {
        const currentStage = await page.evaluate(() => {
          // Look for the stage with the spinner
          const allText = document.body.innerText;
          const stages = [
            'Analyzing Upload Quality',
            'Detecting Body Position', 
            'Measuring Shooting Angles',
            'Analyzing Shooting Form',
            'Comparing to Optimal Form',
            'Generating Personalized Recommendations',
            'Finalizing Your Analysis'
          ];
          
          for (const stage of stages) {
            if (allText.includes(stage)) {
              // Check if there's a loading indicator nearby
              const spinners = document.querySelectorAll('[class*="animate-spin"]');
              if (spinners.length > 0) {
                return stage;
              }
            }
          }
          return null;
        });
        
        if (currentStage && currentStage !== lastStage) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`⏱️ [${elapsed}s] ${currentStage}`);
          lastStage = currentStage;
        }
      } catch (e) {
        // Page might have navigated
      }
    };
    
    // Check every 2 seconds
    const interval = setInterval(checkStage, 2000);
    
    // Wait for navigation to results page
    await page.waitForFunction(
      () => window.location.pathname.includes('/results'),
      { timeout: 120000 }
    );
    
    clearInterval(interval);
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log('');
    console.log(`✅ All 7 stages completed! Total time: ${totalTime} seconds`);
    console.log('✅ Now on results page');
    
    // Take screenshot
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/tmp/phase5_results.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    console.log('\n🔍 Browser is open - view the results!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Keep browser open
  await new Promise(() => {});
})();
