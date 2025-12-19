const { chromium } = require('playwright');

(async () => {
  console.log('=== VIDEO PLAYBACK CHECKLIST TEST ===\n');
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);
  
  // Upload video and get to results
  console.log('1. Navigating to home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  console.log('2. Selecting Video mode...');
  await page.click('button:has-text("Images")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Video"):has-text("10-second")');
  await page.waitForTimeout(1000);
  
  console.log('3. Uploading test video...');
  const videoInput = page.locator('input[accept="video/*"]');
  await videoInput.setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
  await page.waitForTimeout(3000);
  
  console.log('4. Clicking Analyze...');
  await page.click('button:has-text("Analyze")');
  
  console.log('5. Waiting for results (this may take up to 2 minutes)...');
  try {
    await page.waitForURL('**/results/**', { timeout: 180000 });
    console.log('   ✓ Navigated to results page\n');
  } catch (e) {
    console.log('   ✗ Failed to navigate to results\n');
    await browser.close();
    return;
  }
  
  await page.waitForTimeout(5000);
  
  // ============================================================
  // CHECKLIST VERIFICATION
  // ============================================================
  console.log('=== CHECKLIST VERIFICATION ===\n');
  
  // Screenshot Frame 0 (Starter Screen)
  console.log('CHECKLIST ITEM 1: Starter screen shows ALL annotations (not blank)');
  await page.screenshot({ path: 'checklist-1-starter-screen.png', fullPage: false });
  console.log('   → Screenshot saved: checklist-1-starter-screen.png\n');
  
  // Check if frame counter is visible and bigger
  console.log('CHECKLIST ITEM 2: Timer is BIGGER and visible in top right corner');
  const frameCounter = await page.locator('text=/Frame.*\\/.*[0-9]+/').first();
  const frameCounterVisible = await frameCounter.isVisible();
  console.log(`   → Frame counter visible: ${frameCounterVisible}`);
  await page.screenshot({ path: 'checklist-2-timer.png', fullPage: false });
  console.log('   → Screenshot saved: checklist-2-timer.png\n');
  
  // Check video starts paused
  console.log('CHECKLIST ITEM 3: Video starts paused on starter screen');
  const playButton = page.locator('button').filter({ has: page.locator('svg path[d="M8 5v14l11-7z"]') });
  const playButtonVisible = await playButton.count() > 0;
  console.log(`   → Play button visible (video paused): ${playButtonVisible}`);
  await page.screenshot({ path: 'checklist-3-paused.png', fullPage: false });
  console.log('   → Screenshot saved: checklist-3-paused.png\n');
  
  // Press play and capture frames
  console.log('CHECKLIST ITEM 4: Press play → zooms to first annotation card');
  const playBtn = page.locator('button.rounded-full.bg-\\[\\#FFD700\\]');
  if (await playBtn.count() > 0) {
    await playBtn.click();
    console.log('   → Clicked play button');
    
    // Wait a bit and capture
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'checklist-4-after-play.png', fullPage: false });
    console.log('   → Screenshot saved: checklist-4-after-play.png\n');
    
    // Wait for annotation duration (4-5 seconds)
    console.log('CHECKLIST ITEM 5: Holds on annotation card for 4-5 seconds');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'checklist-5-annotation-hold.png', fullPage: false });
    console.log('   → Screenshot saved: checklist-5-annotation-hold.png\n');
    
    // Wait for zoom to body part
    console.log('CHECKLIST ITEM 6: Quick zoom to body part (fast transition, slows down on arrival)');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'checklist-6-zoom-body.png', fullPage: false });
    console.log('   → Screenshot saved: checklist-6-zoom-body.png\n');
    
    // Wait for next annotation
    console.log('CHECKLIST ITEM 7: Repeats for each annotation');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'checklist-7-next-annotation.png', fullPage: false });
    console.log('   → Screenshot saved: checklist-7-next-annotation.png\n');
    
    // Wait for final playback
    console.log('CHECKLIST ITEM 8: Final playback: skeleton only, NO annotations, NO circles');
    await page.waitForTimeout(30000);  // Wait for all annotations to finish
    await page.screenshot({ path: 'checklist-8-final-playback.png', fullPage: false });
    console.log('   → Screenshot saved: checklist-8-final-playback.png\n');
  }
  
  // Scroll to see dropdown list
  console.log('CHECKLIST ITEM 9: Annotation dropdown list visible');
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'checklist-9-dropdown.png', fullPage: false });
  console.log('   → Screenshot saved: checklist-9-dropdown.png\n');
  
  await browser.close();
  console.log('=== TEST COMPLETE ===');
  console.log('Review the checklist-*.png screenshots to verify each item.');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
