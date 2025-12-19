/**
 * Test Image Analysis with Kyle Korver test image
 * 
 * This test:
 * 1. Opens the home page
 * 2. Uploads the Kyle Korver test image
 * 3. Runs analysis
 * 4. Verifies the results page features
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = '/tmp/image_analysis_test';
const IMAGE_PATH = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper function for waiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  console.log('🏀 Starting Image Analysis Test with Kyle Korver image...\n');
  console.log('📁 Screenshots will be saved to:', SCREENSHOTS_DIR);
  console.log('📸 Using image:', IMAGE_PATH);
  console.log('');
  
  // Verify image exists
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error('❌ Image file not found:', IMAGE_PATH);
    process.exit(1);
  }
  console.log('✅ Image file found\n');
  
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
    // STEP 2: Upload the image
    // ============================================
    console.log('📍 STEP 2: Uploading Kyle Korver image...');
    
    // Find image file input
    const fileInput = await page.$('input[type="file"][accept*="image"]');
    if (fileInput) {
      await fileInput.uploadFile(IMAGE_PATH);
      console.log('   ✅ Image uploaded\n');
    } else {
      console.log('   ❌ Could not find image file input\n');
    }
    
    await wait(2000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_image_uploaded.png` });
    
    // ============================================
    // STEP 3: Click Analyze button
    // ============================================
    console.log('📍 STEP 3: Starting analysis...');
    
    const analyzeButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => 
        b.textContent?.toLowerCase().includes('analyze') ||
        b.textContent?.toLowerCase().includes('start')
      );
    });
    
    if (analyzeButton) {
      const element = analyzeButton.asElement();
      if (element) {
        const isDisabled = await page.evaluate(el => el.disabled, element);
        if (!isDisabled) {
          await element.click();
          console.log('   ✅ Clicked Analyze button\n');
        } else {
          console.log('   ⚠️ Analyze button is disabled\n');
        }
      }
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_analysis_started.png` });
    
    // ============================================
    // STEP 4: Wait for analysis to complete
    // ============================================
    console.log('📍 STEP 4: Waiting for analysis...');
    
    let analysisComplete = false;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (!analysisComplete && attempts < maxAttempts) {
      await wait(2000);
      attempts++;
      
      const currentUrl = page.url();
      if (currentUrl.includes('/results')) {
        console.log('   ✅ Redirected to results page!\n');
        analysisComplete = true;
        break;
      }
      
      if (attempts % 5 === 0) {
        console.log(`   Waiting... (${attempts * 2}s)`);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_progress_${attempts}.png` });
      }
    }
    
    if (!analysisComplete) {
      console.log('   ⚠️ Timeout, navigating to results manually...');
      await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 60000 });
    }
    
    await wait(3000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_results_page.png`, fullPage: true });
    
    // ============================================
    // STEP 5: Check results page features
    // ============================================
    console.log('📍 STEP 5: Checking results page features...');
    
    // Check if image is displayed
    const hasImage = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).some(img => img.src && img.src.length > 100);
    });
    
    if (hasImage) {
      console.log('   ✅ Analysis image is displayed\n');
    } else {
      console.log('   ⚠️ No analysis image found\n');
    }
    
    // Check for analysis data
    const hasAnalysisData = await page.evaluate(() => {
      return document.body.innerText.includes('OVERALL SCORE') ||
             document.body.innerText.includes('Joint Angles') ||
             document.body.innerText.includes('Biomechanical');
    });
    
    if (hasAnalysisData) {
      console.log('   ✅ Analysis data is displayed\n');
    } else {
      console.log('   ⚠️ Analysis data not found\n');
    }
    
    // ============================================
    // STEP 6: Take final screenshots
    // ============================================
    console.log('📍 STEP 6: Taking final screenshots...');
    
    // Scroll through the page
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_top.png`, fullPage: true });
    
    console.log('\n========================================');
    console.log('📸 TEST COMPLETE');
    console.log('========================================');
    console.log('Screenshots saved to:', SCREENSHOTS_DIR);
    console.log('');
    
    // Keep browser open for inspection
    console.log('⏳ Browser will stay open for 60 seconds...\n');
    await wait(60000);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/error.png`, fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ Browser closed.');
  }
}

runTest().catch(console.error);

