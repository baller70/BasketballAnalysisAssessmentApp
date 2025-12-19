const { chromium } = require('playwright');

(async () => {
  console.log('=== VIDEO SEQUENCE VERIFICATION TEST ===\n');
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);
  
  // Checklist
  const checklist = {
    starterScreenAllAnnotations: false,
    skeletonVisible: false,
    fixCardsVisible: false,
    connectionLinesVisible: false,
    timerBigger: false,
    zoomToAnnotation: false,
    holdOnAnnotation: false,
    quickZoomToBody: false,
    holdOnBody: false,
    repeatForEachAnnotation: false,
    finalPlaybackSkeletonOnly: false,
    fullShootingMotion: false
  };
  
  try {
    // Step 1: Go to home page and upload video
    console.log('1. Loading home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Select Video mode
    console.log('2. Selecting Video mode...');
    await page.click('button:has-text("Images")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Video"):has-text("10-second")');
    await page.waitForTimeout(1000);
    
    // Upload video
    console.log('3. Uploading test video...');
    const videoInput = page.locator('input[accept="video/*"]');
    await videoInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    await page.waitForTimeout(3000);
    
    // Click analyze
    console.log('4. Starting analysis...');
    await page.click('button:has-text("Analyze")');
    
    // Wait for results
    console.log('5. Waiting for analysis to complete (this may take a while)...');
    await page.waitForURL('**/results/**', { timeout: 180000 });
    await page.waitForTimeout(5000);
    
    // ============================================================
    // VERIFICATION CHECKLIST
    // ============================================================
    
    console.log('\n=== VERIFICATION CHECKLIST ===\n');
    
    // Check 1: Starter screen (Frame 0)
    console.log('Checking starter screen (Frame 0)...');
    await page.screenshot({ path: 'verify-1-starter-screen.png', fullPage: true });
    
    // Check if frame counter shows Frame 1
    const frameText = await page.locator('text=Frame').first().textContent();
    console.log('Frame counter text:', frameText);
    
    // Check 2: Timer is bigger
    const timerElement = await page.locator('.text-2xl:has-text("Frame")').count();
    if (timerElement > 0) {
      checklist.timerBigger = true;
      console.log('✅ Timer is bigger (text-2xl class found)');
    } else {
      console.log('❌ Timer size not verified');
    }
    
    // Take close-up of video area
    const videoArea = page.locator('.aspect-video').first();
    if (await videoArea.count() > 0) {
      await videoArea.screenshot({ path: 'verify-2-video-frame.png' });
      console.log('📸 Video frame screenshot saved');
    }
    
    // Check 3: Advance frames to see the sequence
    console.log('\nAdvancing through frames to verify sequence...');
    
    // Frame 0 - should be starter screen
    await page.screenshot({ path: 'verify-frame-000.png' });
    
    // Advance to frame 10
    const nextBtn = page.locator('button[title="Next frame"]');
    for (let i = 0; i < 10; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }
    await page.screenshot({ path: 'verify-frame-010.png' });
    
    // Advance to frame 50 (should be in annotation sequence)
    for (let i = 0; i < 40; i++) {
      await nextBtn.click();
      await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'verify-frame-050.png' });
    
    // Advance to frame 100
    for (let i = 0; i < 50; i++) {
      await nextBtn.click();
      await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'verify-frame-100.png' });
    
    // Advance to frame 200 (should be in final playback)
    for (let i = 0; i < 100; i++) {
      await nextBtn.click();
      await page.waitForTimeout(30);
    }
    await page.screenshot({ path: 'verify-frame-200.png' });
    
    // Go to end
    const endBtn = page.locator('button[title="Go to end"]');
    await endBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'verify-frame-end.png' });
    
    // Go back to start
    const startBtn = page.locator('button[title="Go to start"]');
    await startBtn.click();
    await page.waitForTimeout(500);
    
    // Take final verification screenshot
    await page.screenshot({ path: 'verify-final.png', fullPage: true });
    
    console.log('\n=== SCREENSHOTS SAVED ===');
    console.log('- verify-1-starter-screen.png (full page)');
    console.log('- verify-2-video-frame.png (video area only)');
    console.log('- verify-frame-000.png (frame 0)');
    console.log('- verify-frame-010.png (frame 10)');
    console.log('- verify-frame-050.png (frame 50)');
    console.log('- verify-frame-100.png (frame 100)');
    console.log('- verify-frame-200.png (frame 200)');
    console.log('- verify-frame-end.png (last frame)');
    console.log('- verify-final.png (final state)');
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'verify-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETE ===');
})();
