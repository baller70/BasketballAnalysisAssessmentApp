const { chromium } = require('playwright');

(async () => {
  console.log('=== BROWSER VERIFICATION CHECKLIST ===\n');
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);
  
  const checklist = {
    '1. Starter Screen Shows All Annotations': false,
    '2. Skeleton/Wireframe Visible on Starter': false,
    '3. All Fix Cards Visible on Starter': false,
    '4. Connection Lines Visible on Starter': false,
    '5. Timer is Bigger (text-2xl)': false,
    '6. Video Pauses on Starter Screen': false,
    '7. Zoom to Annotation Card (4-5s hold)': false,
    '8. Quick Pan/Zoom to Body Part': false,
    '9. Hold on Body Part (3s)': false,
    '10. Repeat for Each Annotation': false,
    '11. Final Playback - Skeleton Only': false,
    '12. Final Playback - No Annotations': false,
    '13. Final Playback - No Circles': false,
    '14. Final Playback - Smooth Motion': false
  };
  
  try {
    console.log('Step 1: Loading home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('Step 2: Selecting Video mode...');
    await page.click('button:has-text("Images")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Video"):has-text("10-second")');
    await page.waitForTimeout(1000);
    
    console.log('Step 3: Uploading test video...');
    const videoInput = page.locator('input[accept="video/*"]');
    await videoInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    await page.waitForTimeout(3000);
    
    console.log('Step 4: Starting analysis (this may take 2-3 minutes)...');
    await page.click('button:has-text("Analyze")');
    
    console.log('Step 5: Waiting for results...');
    await page.waitForURL('**/results/**', { timeout: 180000 });
    await page.waitForTimeout(8000); // Wait for video to load
    
    // ============================================================
    // CHECKLIST VERIFICATION
    // ============================================================
    
    console.log('\n=== VERIFYING CHECKLIST ===\n');
    
    // Check 1-4: Starter Screen (Frame 0)
    console.log('Checking starter screen (Frame 0)...');
    await page.screenshot({ path: 'checklist-1-starter-screen.png', fullPage: true });
    
    // Check if video area is visible (not black)
    const videoArea = page.locator('.aspect-video canvas, .aspect-video img').first();
    const videoVisible = await videoArea.count() > 0;
    console.log(`Video area visible: ${videoVisible}`);
    
    // Check 5: Timer size
    const timerElement = page.locator('.text-2xl:has-text("Frame")');
    const timerCount = await timerElement.count();
    if (timerCount > 0) {
      checklist['5. Timer is Bigger (text-2xl)'] = true;
      console.log('✅ Timer is bigger');
    } else {
      console.log('❌ Timer size not verified');
    }
    
    // Check frame counter shows Frame 1
    const frameText = await page.locator('text=/Frame \\d+/').first().textContent();
    console.log(`Frame counter: ${frameText}`);
    
    // Advance through frames to verify sequence
    console.log('\nAdvancing through frames...');
    const nextBtn = page.locator('button[title="Next frame"]');
    
    // Frame 0 (starter)
    await page.screenshot({ path: 'checklist-frame-000.png' });
    
    // Advance to frame 10 (should still be in starter screen)
    for (let i = 0; i < 10; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }
    await page.screenshot({ path: 'checklist-frame-010.png' });
    
    // Advance to frame 50 (should be in annotation sequence)
    for (let i = 0; i < 40; i++) {
      await nextBtn.click();
      await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'checklist-frame-050.png' });
    
    // Advance to frame 100
    for (let i = 0; i < 50; i++) {
      await nextBtn.click();
      await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'checklist-frame-100.png' });
    
    // Advance to frame 200 (should be in final playback)
    for (let i = 0; i < 100; i++) {
      await nextBtn.click();
      await page.waitForTimeout(30);
    }
    await page.screenshot({ path: 'checklist-frame-200.png' });
    
    // Go to end
    const endBtn = page.locator('button[title="Go to end"]');
    await endBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'checklist-frame-end.png' });
    
    // Go back to start
    const startBtn = page.locator('button[title="Go to start"]');
    await startBtn.click();
    await page.waitForTimeout(500);
    
    // Final screenshot
    await page.screenshot({ path: 'checklist-final.png', fullPage: true });
    
    console.log('\n=== SCREENSHOTS SAVED ===');
    console.log('Review the screenshots to verify:');
    console.log('1. Starter screen shows all annotations');
    console.log('2. Timer is bigger');
    console.log('3. Video frames display correctly (not black)');
    console.log('4. Sequence flows properly');
    
    // Print checklist summary
    console.log('\n=== CHECKLIST SUMMARY ===');
    Object.entries(checklist).forEach(([item, status]) => {
      console.log(`${status ? '✅' : '⏳'} ${item}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'checklist-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('\n=== VERIFICATION COMPLETE ===');
})();
