/**
 * End-to-End Test: /analyze page
 * Upload image → Analyze → See skeleton results
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  console.log('🏀 Testing /analyze page - Upload and Analyze\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Log API calls
  page.on('response', response => {
    const url = response.url();
    if (url.includes('7860') || url.includes('detect-pose') || url.includes('analyze-form')) {
      console.log(`📡 API: ${response.status()} ${url.split('/').pop()}`);
    }
  });
  
  try {
    // Step 1: Go to /analyze page
    console.log('📍 Step 1: Opening /analyze page...');
    await page.goto('http://localhost:3000/analyze', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'analyze_01_page.png') });
    console.log('   ✅ Page loaded\n');
    
    // Step 2: Upload Kyle Korver image
    console.log('📍 Step 2: Uploading Kyle Korver image...');
    const imagePath = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imagePath);
    console.log('   ✅ Image uploaded\n');
    
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'analyze_02_uploaded.png') });
    
    // Step 3: Find and click Analyze button
    console.log('📍 Step 3: Looking for Analyze button...');
    
    // Wait for the PoseAnalysis component to load
    await page.waitForTimeout(1000);
    
    const analyzeBtn = page.locator('button:has-text("Analyze")').first();
    const btnCount = await analyzeBtn.count();
    console.log(`   Found ${btnCount} Analyze button(s)`);
    
    if (btnCount > 0) {
      const isDisabled = await analyzeBtn.isDisabled();
      console.log(`   Button disabled: ${isDisabled}`);
      
      if (!isDisabled) {
        console.log('   Clicking Analyze...');
        await analyzeBtn.click();
        console.log('   ✅ Clicked!\n');
        
        // Wait for analysis to complete
        console.log('📍 Step 4: Waiting for analysis...');
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'analyze_03_results.png') });
        
        // Check for skeleton/results
        const hasKeypoints = await page.locator('text=keypoints, text=Keypoints, text=confidence').count();
        const hasScore = await page.locator('text=Score, text=score, text=Grade').count();
        const hasFeedback = await page.locator('text=Feedback, text=feedback, text=Elbow, text=Knee').count();
        
        console.log(`   Keypoints displayed: ${hasKeypoints > 0 ? '✅' : '❌'}`);
        console.log(`   Score displayed: ${hasScore > 0 ? '✅' : '❌'}`);
        console.log(`   Feedback displayed: ${hasFeedback > 0 ? '✅' : '❌'}\n`);
      } else {
        console.log('   ⚠️ Button is disabled\n');
      }
    } else {
      console.log('   ⚠️ No Analyze button found\n');
    }
    
    // Final screenshot
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'analyze_04_final.png'), fullPage: true });
    
    console.log('='.repeat(50));
    console.log('📸 Screenshots saved to test_screenshots/');
    console.log('='.repeat(50));
    
    // Keep browser open
    console.log('\n⏳ Browser open for 30 seconds - inspect the results...\n');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'analyze_error.png') });
  } finally {
    await browser.close();
    console.log('🏁 Done');
  }
}

// Ensure screenshots directory
const screenshotsDir = path.join(__dirname, 'test_screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

runTest();




