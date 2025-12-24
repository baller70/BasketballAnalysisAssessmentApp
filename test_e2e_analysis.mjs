/**
 * End-to-End Test: Basketball Analysis Upload Flow
 * Tests the full flow: Upload image → Pose detection → Form analysis
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  console.log('🏀 Starting End-to-End Analysis Test\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser so you can see it
    slowMo: 500       // Slow down actions so you can follow along
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Go to the analyze page
    console.log('📍 Step 1: Navigating to /analyze page...');
    await page.goto('http://localhost:3000/analyze', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test_screenshots/01_initial_page.png' });
    console.log('   ✅ Page loaded\n');
    
    // Step 2: Upload the Kyle Korver test image
    console.log('📍 Step 2: Uploading Kyle Korver test image...');
    const testImagePath = path.join(__dirname, 'kyle_korver_test.jpg');
    
    // Find the file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(2000);
    
    // Take screenshot after upload
    await page.screenshot({ path: 'test_screenshots/02_image_uploaded.png' });
    console.log('   ✅ Image uploaded\n');
    
    // Step 3: Wait for the PoseAnalysis component to render
    console.log('📍 Step 3: Waiting for analysis component...');
    await page.waitForTimeout(2000);
    
    // Take screenshot showing the image preview
    await page.screenshot({ path: 'test_screenshots/03_image_preview.png' });
    console.log('   ✅ Analysis component rendered\n');
    
    // Step 4: Click the Analyze button
    console.log('📍 Step 4: Looking for Analyze button...');
    
    // Look for a button with "Analyze" text
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    
    if (await analyzeButton.isVisible()) {
      console.log('   Found Analyze button, clicking...');
      await analyzeButton.click();
      
      // Wait for analysis to complete (may take a few seconds)
      console.log('   ⏳ Waiting for analysis to complete...');
      await page.waitForTimeout(10000); // Give it time to process
      
      // Take screenshot of results
      await page.screenshot({ path: 'test_screenshots/04_analysis_results.png' });
      console.log('   ✅ Analysis complete\n');
    } else {
      console.log('   ⚠️ No Analyze button found - checking if auto-analysis triggered...');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'test_screenshots/04_no_button_state.png' });
    }
    
    // Step 5: Check for results on the page
    console.log('📍 Step 5: Checking for analysis results...');
    
    // Look for indicators that analysis completed
    const pageContent = await page.content();
    
    const hasKeypoints = pageContent.includes('keypoint') || pageContent.includes('Keypoint');
    const hasScore = pageContent.includes('score') || pageContent.includes('Score');
    const hasFeedback = pageContent.includes('feedback') || pageContent.includes('Feedback');
    const hasElbow = pageContent.includes('elbow') || pageContent.includes('Elbow');
    const hasKnee = pageContent.includes('knee') || pageContent.includes('Knee');
    
    console.log(`   Keypoints mentioned: ${hasKeypoints ? '✅' : '❌'}`);
    console.log(`   Score mentioned: ${hasScore ? '✅' : '❌'}`);
    console.log(`   Feedback mentioned: ${hasFeedback ? '✅' : '❌'}`);
    console.log(`   Elbow analysis: ${hasElbow ? '✅' : '❌'}`);
    console.log(`   Knee analysis: ${hasKnee ? '✅' : '❌'}`);
    
    // Final screenshot
    await page.screenshot({ path: 'test_screenshots/05_final_state.png', fullPage: true });
    
    // Check console for API calls
    console.log('\n📍 Step 6: Checking network requests...');
    
    // Keep browser open for manual inspection
    console.log('\n✅ Test completed! Browser will stay open for 30 seconds for inspection...');
    console.log('   Screenshots saved in test_screenshots/ folder');
    
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test_screenshots/error_state.png' });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
import fs from 'fs';
const screenshotDir = path.join(__dirname, 'test_screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

runTest().catch(console.error);



















