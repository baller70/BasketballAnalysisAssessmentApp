/**
 * End-to-End Test: YOUR Basketball Analysis App
 * Tests the real app with 7 angle upload slots
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  console.log('🏀 Testing YOUR Real Basketball Analysis App\n');
  console.log('This will open your actual app with the 7 angle upload slots.\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser so you can see it
    slowMo: 300       // Slow down actions so you can follow along
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Log console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });
  
  // Log network requests to the backend
  page.on('response', response => {
    const url = response.url();
    if (url.includes('7860') || url.includes('api')) {
      console.log(`📡 API Response: ${response.status()} ${url.split('/').slice(-2).join('/')}`);
    }
  });
  
  try {
    // Step 1: Go to the main page (your real app)
    console.log('📍 Step 1: Opening your app at http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_01_homepage.png') });
    console.log('   ✅ Homepage loaded\n');
    
    // Wait for the page to fully render
    await page.waitForTimeout(1000);
    
    // Step 2: Look for the 7 angle slots
    console.log('📍 Step 2: Looking for the 7 angle upload slots...');
    
    // Check if angle slots exist
    const angleSlots = await page.locator('text=Angle 1').count();
    if (angleSlots > 0) {
      console.log('   ✅ Found the 7 angle upload slots!\n');
    } else {
      console.log('   ⚠️  Angle slots not immediately visible, scrolling down...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_02_upload_area.png') });
    
    // Step 3: Upload Kyle Korver image to Angle 1
    console.log('📍 Step 3: Uploading Kyle Korver image to Angle 1...');
    const imagePath = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
    
    // Find the first angle slot's file input
    const fileInputs = await page.locator('input[type="file"][accept="image/*"]').all();
    console.log(`   Found ${fileInputs.length} file input(s)`);
    
    if (fileInputs.length > 0) {
      await fileInputs[0].setInputFiles(imagePath);
      console.log('   ✅ Image uploaded to Angle 1\n');
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_03_angle1_uploaded.png') });
    
    // Step 4: Upload to Angle 2 and Angle 3 (need at least 3 for the strip)
    console.log('📍 Step 4: Uploading to Angle 2 and Angle 3 (need 3 minimum)...');
    
    if (fileInputs.length >= 3) {
      await fileInputs[1].setInputFiles(imagePath);
      console.log('   ✅ Image uploaded to Angle 2');
      await page.waitForTimeout(500);
      
      await fileInputs[2].setInputFiles(imagePath);
      console.log('   ✅ Image uploaded to Angle 3\n');
      await page.waitForTimeout(2000); // Wait for strip building
    }
    
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_04_three_angles.png') });
    
    // Step 5: Fill out the Player Profile form
    console.log('📍 Step 5: Filling out Player Profile...');
    
    // Look for form fields
    const nameInput = page.locator('input[placeholder*="name" i], input[name="name"]').first();
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Player');
      console.log('   ✅ Name filled');
    }
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      console.log('   ✅ Email filled');
    }
    
    // Look for position dropdown/select
    const positionSelect = page.locator('select, [role="combobox"]').first();
    if (await positionSelect.count() > 0) {
      await positionSelect.click();
      await page.waitForTimeout(300);
      const guardOption = page.locator('text=Guard, text=Point Guard, text=SG').first();
      if (await guardOption.count() > 0) {
        await guardOption.click();
        console.log('   ✅ Position selected');
      }
    }
    
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_05_form_filled.png') });
    console.log('');
    
    // Step 6: Click Analyze button
    console.log('📍 Step 6: Looking for Analyze button...');
    
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Submit"), button:has-text("Start")').first();
    
    if (await analyzeButton.count() > 0) {
      const isDisabled = await analyzeButton.isDisabled();
      console.log(`   Analyze button found, disabled: ${isDisabled}`);
      
      if (!isDisabled) {
        console.log('   Clicking Analyze button...');
        await analyzeButton.click();
        console.log('   ✅ Analyze button clicked!\n');
        
        // Wait for navigation or results
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_06_after_analyze.png') });
      } else {
        console.log('   ⚠️  Button is disabled - check if all required fields are filled\n');
      }
    } else {
      console.log('   ⚠️  Analyze button not found\n');
    }
    
    // Step 7: Check for any strip or results
    console.log('📍 Step 7: Checking for shot breakdown strip...');
    
    const stripVisible = await page.locator('text=Strip, text=Sample, text=Full Strip').count();
    if (stripVisible > 0) {
      console.log('   ✅ Shot breakdown strip is visible!\n');
    }
    
    // Final screenshot
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_07_final.png'), fullPage: true });
    
    console.log('\n' + '='.repeat(60));
    console.log('📸 Screenshots saved to test_screenshots/ folder:');
    console.log('   - real_01_homepage.png');
    console.log('   - real_02_upload_area.png');
    console.log('   - real_03_angle1_uploaded.png');
    console.log('   - real_04_three_angles.png');
    console.log('   - real_05_form_filled.png');
    console.log('   - real_06_after_analyze.png');
    console.log('   - real_07_final.png');
    console.log('='.repeat(60));
    
    // Keep browser open for 30 seconds so you can see it
    console.log('\n⏳ Browser will stay open for 30 seconds so you can inspect...');
    console.log('   You can interact with the app during this time.\n');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: path.join(__dirname, 'test_screenshots', 'real_error.png') });
  } finally {
    await browser.close();
    console.log('\n🏁 Test complete. Browser closed.');
  }
}

// Ensure screenshots directory exists
import fs from 'fs';
const screenshotsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'test_screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

runTest();

