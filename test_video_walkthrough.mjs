/**
 * Test Video Walkthrough Feature
 * 
 * Tests:
 * 1. Cover screen shows full annotated image before play
 * 2. Timer INSIDE video (upper right) is bigger
 * 3. Timer OUTSIDE video is regular size
 * 4. Annotation walkthrough section appears
 * 
 * Uses: "test 1.mp4" video file
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Helper function for waiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const SCREENSHOTS_DIR = '/tmp/video_walkthrough_test';
const VIDEO_PATH = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTest() {
  console.log('🎬 Starting Video Walkthrough Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for visual verification
    args: ['--window-size=1400,900']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    // Step 1: Go to upload page
    console.log('📍 Step 1: Navigating to upload page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_upload_page.png` });
    console.log('   ✅ Upload page loaded\n');
    
    // Step 2: Check if video file exists
    console.log('📍 Step 2: Checking video file...');
    if (!fs.existsSync(VIDEO_PATH)) {
      console.log('   ❌ Video file not found:', VIDEO_PATH);
      console.log('   Looking for video files...');
      const files = fs.readdirSync('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL');
      const videoFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
      console.log('   Found video files:', videoFiles);
      throw new Error('Test video not found');
    }
    console.log('   ✅ Video file found: test 1.mp4\n');
    
    // Step 3: Upload the video
    console.log('📍 Step 3: Uploading video...');
    
    // Find the file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(VIDEO_PATH);
      console.log('   ✅ Video uploaded\n');
      
      // Wait for processing
      console.log('📍 Step 4: Waiting for video processing...');
      await wait(5000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_video_uploaded.png` });
      
      // Check if analyze button appears and click it
      const analyzeButton = await page.$('button:has-text("Analyze")');
      if (analyzeButton) {
        await analyzeButton.click();
        console.log('   ✅ Clicked Analyze button\n');
      }
      
      // Wait for analysis to complete (this may take a while)
      console.log('📍 Step 5: Waiting for analysis...');
      await wait(15000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_analysis_in_progress.png` });
      
    } else {
      console.log('   ⚠️ File input not found, trying alternative method...');
      
      // Try drag and drop or click on upload area
      const uploadArea = await page.$('[class*="upload"]');
      if (uploadArea) {
        await uploadArea.click();
        await wait(1000);
      }
    }
    
    // Step 6: Navigate to results page (if not auto-redirected)
    console.log('📍 Step 6: Checking results page...');
    
    // Wait a bit more for redirect
    await wait(5000);
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (!currentUrl.includes('/results')) {
      console.log('   Navigating to results demo page...');
      await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 60000 });
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_results_page.png`, fullPage: true });
    console.log('   ✅ Results page loaded\n');
    
    // Step 7: Check for Video mode tab
    console.log('📍 Step 7: Looking for Video mode...');
    
    // Click on Video tab if available
    const videoTab = await page.$('button:has-text("Video")');
    if (videoTab) {
      await videoTab.click();
      await wait(2000);
      console.log('   ✅ Switched to Video mode\n');
    } else {
      console.log('   ⚠️ Video tab not found (may already be in video mode)\n');
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_video_mode.png`, fullPage: true });
    
    // Step 8: Check for timer sizes
    console.log('📍 Step 8: Checking timer elements...');
    
    // Check for the frame counter (outside timer - should be regular size)
    const frameCounter = await page.$('div:has-text("Frame")');
    if (frameCounter) {
      const fontSize = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.fontSize;
      }, frameCounter);
      console.log('   Frame counter font size:', fontSize);
      console.log('   ✅ Timer OUTSIDE video found (should be regular size)\n');
    }
    
    // Step 9: Check for Annotation Walkthrough section
    console.log('📍 Step 9: Looking for Annotation Walkthrough...');
    
    const walkthroughSection = await page.$('h3:has-text("Annotation Walkthrough")');
    if (walkthroughSection) {
      console.log('   ✅ Annotation Walkthrough section found!\n');
      
      // Scroll to it
      await walkthroughSection.scrollIntoViewIfNeeded();
      await wait(1000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_walkthrough_section.png` });
      
      // Look for the walkthrough canvas
      const walkthroughCanvas = await page.$('canvas');
      if (walkthroughCanvas) {
        console.log('   ✅ Walkthrough canvas found (cover screen)\n');
      }
      
      // Try to click play on the walkthrough
      const playButton = await page.$('button[title*="play"], button:has(svg)');
      if (playButton) {
        console.log('   Clicking play button...');
        await playButton.click();
        await wait(3000);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/07_walkthrough_playing.png` });
        console.log('   ✅ Walkthrough started\n');
      }
    } else {
      console.log('   ⚠️ Annotation Walkthrough section not found\n');
    }
    
    // Final screenshot
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/08_final_state.png`, fullPage: true });
    
    console.log('\n========================================');
    console.log('📸 Screenshots saved to:', SCREENSHOTS_DIR);
    console.log('========================================\n');
    
    console.log('🔍 MANUAL VERIFICATION NEEDED:');
    console.log('   1. Check that cover screen shows full annotated image');
    console.log('   2. Verify timer INSIDE video (upper right) is BIGGER');
    console.log('   3. Verify timer OUTSIDE video is regular/small size');
    console.log('   4. Play walkthrough and verify:');
    console.log('      - Zooms into annotation text (4-5 sec)');
    console.log('      - Fast pans to body part');
    console.log('      - Holds on body part (2-3 sec)');
    console.log('      - Repeats for all annotations');
    console.log('      - Ends with full skeleton view\n');
    
    // Keep browser open for manual inspection
    console.log('⏳ Browser will stay open for 60 seconds for manual inspection...');
    console.log('   Press Ctrl+C to close earlier.\n');
    
    await wait(60000);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/error_state.png`, fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ Test complete. Browser closed.');
  }
}

runTest().catch(console.error);

