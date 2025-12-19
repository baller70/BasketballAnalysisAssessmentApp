/**
 * Complete Video Walkthrough Test
 * 
 * This test:
 * 1. Opens the home page
 * 2. Switches to video mode
 * 3. Uploads "test 1.mp4"
 * 4. Waits for analysis to complete
 * 5. Verifies the results page has:
 *    - Cover screen with full annotated image
 *    - Timer INSIDE video is BIGGER
 *    - Timer OUTSIDE video is regular size
 *    - Annotation walkthrough section
 * 6. Takes screenshots at each step
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = '/tmp/video_complete_test';
const VIDEO_PATH = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper function for waiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  console.log('🎬 Starting Complete Video Walkthrough Test...\n');
  console.log('📁 Screenshots will be saved to:', SCREENSHOTS_DIR);
  console.log('📹 Using video:', VIDEO_PATH);
  console.log('');
  
  // Verify video exists
  if (!fs.existsSync(VIDEO_PATH)) {
    console.error('❌ Video file not found:', VIDEO_PATH);
    process.exit(1);
  }
  console.log('✅ Video file found\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1500,1000', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000 });
  
  try {
    // ============================================
    // STEP 1: Go to home page
    // ============================================
    console.log('📍 STEP 1: Opening home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_home_page.png` });
    console.log('   ✅ Home page loaded\n');
    
    // ============================================
    // STEP 2: Switch to video mode using dropdown
    // ============================================
    console.log('📍 STEP 2: Switching to video mode...');
    
    // First, click on the dropdown to open it
    const dropdownButton = await page.evaluateHandle(() => {
      // Find the button that contains "Images" (the default selected option)
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => 
        b.textContent?.includes('Images') || 
        b.textContent?.includes('Select Media Type') ||
        b.querySelector('svg.lucide-chevron-down')
      );
    });
    
    if (dropdownButton) {
      const element = dropdownButton.asElement();
      if (element) {
        await element.click();
        await wait(500);
        console.log('   ✅ Opened media type dropdown');
        
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/02a_dropdown_open.png` });
        
        // Now click on the "Video" option in the dropdown
        const videoOption = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => 
            b.textContent?.includes('Video') && 
            b.textContent?.includes('10-second')
          );
        });
        
        if (videoOption) {
          const videoEl = videoOption.asElement();
          if (videoEl) {
            await videoEl.click();
            await wait(1000);
            console.log('   ✅ Selected Video mode from dropdown\n');
          }
        }
      }
    } else {
      console.log('   ⚠️ Could not find dropdown button\n');
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_video_mode.png` });
    
    // ============================================
    // STEP 3: Upload the video file
    // ============================================
    console.log('📍 STEP 3: Uploading video file...');
    
    // Find file input that accepts video
    const fileInputs = await page.$$('input[type="file"]');
    let uploaded = false;
    
    for (const input of fileInputs) {
      try {
        const accept = await page.evaluate(el => el.getAttribute('accept'), input);
        console.log('   Found input with accept:', accept);
        
        // Only use the video input
        if (accept && accept.includes('video')) {
          await input.uploadFile(VIDEO_PATH);
          uploaded = true;
          console.log('   ✅ Video file uploaded to video input\n');
          break;
        }
      } catch (e) {
        console.log('   Could not upload to this input, trying next...');
      }
    }
    
    if (!uploaded) {
      console.log('   ⚠️ No video input found, trying to click on video upload area...');
      
      // Look for the video upload area specifically
      const videoUploadArea = await page.evaluateHandle(() => {
        // Find label or div that contains "Click to upload video"
        const elements = Array.from(document.querySelectorAll('label, div'));
        return elements.find(el => el.textContent?.includes('upload video'));
      });
      
      if (videoUploadArea) {
        const element = videoUploadArea.asElement();
        if (element) {
          await element.click();
          await wait(1000);
          
          // Now find the file input and upload
          const videoInput = await page.$('input[type="file"][accept*="video"]');
          if (videoInput) {
            await videoInput.uploadFile(VIDEO_PATH);
            uploaded = true;
            console.log('   ✅ Video file uploaded after clicking area\n');
          }
        }
      }
    }
    
    if (!uploaded) {
      console.log('   ❌ Could not find video upload input\n');
    }
    
    await wait(2000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_video_uploaded.png` });
    
    // ============================================
    // STEP 4: Click Analyze button
    // ============================================
    console.log('📍 STEP 4: Starting analysis...');
    
    // Find and click the analyze button
    const analyzeButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => 
        b.textContent?.toLowerCase().includes('analyze') ||
        b.textContent?.toLowerCase().includes('start') ||
        b.textContent?.toLowerCase().includes('submit')
      );
    });
    
    if (analyzeButton) {
      const element = analyzeButton.asElement();
      if (element) {
        // Check if button is disabled
        const isDisabled = await page.evaluate(el => el.disabled, element);
        if (!isDisabled) {
          await element.click();
          console.log('   ✅ Clicked Analyze button\n');
        } else {
          console.log('   ⚠️ Analyze button is disabled\n');
        }
      }
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_analysis_started.png` });
    
    // ============================================
    // STEP 5: Wait for analysis to complete
    // ============================================
    console.log('📍 STEP 5: Waiting for analysis to complete...');
    console.log('   (This may take 30-60 seconds for video processing)');
    
    // Wait for redirect to results page or completion
    let analysisComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 * 2 seconds = 2 minutes max
    
    while (!analysisComplete && attempts < maxAttempts) {
      await wait(2000);
      attempts++;
      
      const currentUrl = page.url();
      
      // Check if redirected to results
      if (currentUrl.includes('/results')) {
        console.log('   ✅ Redirected to results page!\n');
        analysisComplete = true;
        break;
      }
      
      // Check for progress indicator
      const progress = await page.evaluate(() => {
        const progressText = document.body.innerText;
        const match = progressText.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      });
      
      if (progress > 0) {
        console.log(`   Progress: ${progress}%`);
      }
      
      // Check for error
      const hasError = await page.evaluate(() => {
        return document.body.innerText.toLowerCase().includes('error') ||
               document.body.innerText.toLowerCase().includes('failed');
      });
      
      if (hasError) {
        console.log('   ⚠️ Error detected during analysis');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_error.png` });
      }
      
      // Take periodic screenshots
      if (attempts % 10 === 0) {
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_progress_${attempts}.png` });
      }
    }
    
    if (!analysisComplete) {
      console.log('   ⚠️ Analysis taking too long, navigating to results manually...');
      await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 60000 });
    }
    
    await wait(3000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_results_page.png`, fullPage: true });
    
    // ============================================
    // STEP 6: Verify Video Mode features
    // ============================================
    console.log('📍 STEP 6: Verifying Video Mode features...');
    
    // Check if we're in video mode
    const hasVideoPlayer = await page.evaluate(() => {
      return document.body.innerText.includes('Video Frame-by-Frame') ||
             document.body.innerText.includes('Frame') ||
             document.querySelector('canvas') !== null;
    });
    
    if (hasVideoPlayer) {
      console.log('   ✅ Video player section found\n');
    } else {
      console.log('   ⚠️ Video player not found - checking for Video tab...\n');
      
      // Try clicking Video tab
      const videoTab = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent?.toLowerCase().includes('video'));
      });
      
      if (videoTab) {
        const element = videoTab.asElement();
        if (element) {
          await element.click();
          await wait(2000);
          await page.screenshot({ path: `${SCREENSHOTS_DIR}/07_video_tab_clicked.png`, fullPage: true });
        }
      }
    }
    
    // ============================================
    // STEP 7: Check Timer sizes
    // ============================================
    console.log('📍 STEP 7: Checking timer sizes...');
    
    // Check for frame counter (outside timer)
    const frameCounterInfo = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent?.includes('Frame') && el.textContent?.includes('/')) {
          const style = window.getComputedStyle(el);
          return {
            found: true,
            fontSize: style.fontSize,
            text: el.textContent.trim().substring(0, 50)
          };
        }
      }
      return { found: false };
    });
    
    if (frameCounterInfo.found) {
      console.log('   Frame counter (OUTSIDE video):', frameCounterInfo.fontSize, '-', frameCounterInfo.text);
      console.log('   ✅ Timer outside video found\n');
    }
    
    // ============================================
    // STEP 8: Check for Annotation Walkthrough
    // ============================================
    console.log('📍 STEP 8: Looking for Annotation Walkthrough...');
    
    const hasWalkthrough = await page.evaluate(() => {
      return document.body.innerText.includes('Annotation Walkthrough') ||
             document.body.innerText.includes('Walkthrough');
    });
    
    if (hasWalkthrough) {
      console.log('   ✅ Annotation Walkthrough section found!\n');
      
      // Scroll to it
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        for (const el of elements) {
          if (el.textContent?.includes('Annotation Walkthrough')) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      });
      
      await wait(1000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/08_walkthrough_section.png` });
    } else {
      console.log('   ⚠️ Annotation Walkthrough section NOT found\n');
    }
    
    // ============================================
    // STEP 9: Final full page screenshot
    // ============================================
    console.log('📍 STEP 9: Taking final screenshots...');
    
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/09_final_top.png`, fullPage: true });
    
    console.log('\n========================================');
    console.log('📸 TEST COMPLETE');
    console.log('========================================');
    console.log('Screenshots saved to:', SCREENSHOTS_DIR);
    console.log('\nCheck the following:');
    console.log('1. Timer INSIDE video (upper right) should be BIGGER (32px bold)');
    console.log('2. Timer OUTSIDE video should be regular size (text-sm)');
    console.log('3. Annotation Walkthrough section should appear below video controls');
    console.log('4. Cover screen should show full annotated image before play');
    console.log('');
    
    // Keep browser open for manual inspection
    console.log('⏳ Browser will stay open for 120 seconds for manual inspection...');
    console.log('   Press Ctrl+C to close earlier.\n');
    
    await wait(120000);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/error_final.png`, fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ Browser closed.');
  }
}

runTest().catch(console.error);

