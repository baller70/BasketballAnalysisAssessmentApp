import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fullVideoTest() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('AutoScreenshots') || text.includes('keypoint') || text.includes('Crop') || text.includes('screenshot')) {
      console.log('🔧 PAGE:', text);
    }
  });
  
  // STEP 1: Go to home page
  console.log('\n📍 STEP 1: Navigate to home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'full_test_01_home.png' });
  console.log('📸 Screenshot: Home page');
  
  // STEP 2: Click on the dropdown to open it
  console.log('\n📍 STEP 2: Open media type dropdown...');
  try {
    // Find the dropdown button (it has "Images" text and a chevron)
    await page.waitForSelector('button', { timeout: 5000 });
    const buttons = await page.$$('button');
    
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent || '');
      if (text.includes('Images') && text.includes('Upload 3-7')) {
        console.log('Found dropdown button, clicking...');
        await btn.click();
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }
    
    await page.screenshot({ path: 'full_test_02_dropdown_open.png' });
    console.log('📸 Screenshot: Dropdown opened');
  } catch (e) {
    console.log('Dropdown error:', e.message);
  }
  
  // STEP 3: Select Video option
  console.log('\n📍 STEP 3: Select Video option...');
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent || '');
      if (text.includes('Video') && text.includes('10-second')) {
        console.log('Found Video option, clicking...');
        await btn.click();
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
    
    await page.screenshot({ path: 'full_test_03_video_selected.png' });
    console.log('📸 Screenshot: Video mode selected');
  } catch (e) {
    console.log('Video selection error:', e.message);
  }
  
  // STEP 4: Upload the test video
  console.log('\n📍 STEP 4: Upload test video...');
  const testVideoPath = path.join(__dirname, 'test 1.mp4');
  console.log('Video path:', testVideoPath);
  
  try {
    // Find the file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(testVideoPath);
      console.log('✅ Video file selected');
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'full_test_04_video_uploaded.png' });
      console.log('📸 Screenshot: Video uploaded');
    } else {
      console.log('❌ No file input found');
    }
  } catch (e) {
    console.log('Upload error:', e.message);
  }
  
  // STEP 5: Click Analyze button
  console.log('\n📍 STEP 5: Click Analyze button...');
  try {
    await new Promise(r => setTimeout(r, 2000));
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent || '');
      const isDisabled = await btn.evaluate(el => el.disabled);
      
      if (text.includes('Analyze') && !isDisabled) {
        console.log('Found Analyze button, clicking...');
        await btn.click();
        break;
      }
    }
    
    await page.screenshot({ path: 'full_test_05_analyzing.png' });
    console.log('📸 Screenshot: Analysis started');
  } catch (e) {
    console.log('Analyze error:', e.message);
  }
  
  // STEP 6: Wait for analysis to complete (watch for URL change or loading to finish)
  console.log('\n📍 STEP 6: Waiting for analysis to complete...');
  try {
    // Wait up to 60 seconds for navigation to results page
    await page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle0' }).catch(() => {});
    
    // Take screenshots during wait
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 5000));
      await page.screenshot({ path: `full_test_06_waiting_${i}.png` });
      console.log(`📸 Screenshot: Waiting ${(i+1)*5}s...`);
      
      const url = page.url();
      if (url.includes('results')) {
        console.log('✅ Navigated to results page!');
        break;
      }
    }
  } catch (e) {
    console.log('Wait error:', e.message);
  }
  
  // STEP 7: Check current state
  const currentUrl = page.url();
  console.log('\n📍 Current URL:', currentUrl);
  await page.screenshot({ path: 'full_test_07_current_state.png' });
  
  // STEP 8: If on results page, scroll to find screenshots
  if (currentUrl.includes('results')) {
    console.log('\n📍 STEP 8: On results page, scrolling to find screenshots...');
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Take screenshots while scrolling
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `full_test_08_scroll_${i}.png` });
      
      // Check for screenshots section
      const content = await page.content();
      if (content.includes('Key Point Analysis') || content.includes('Hands & Release') || content.includes('hands-area')) {
        console.log('📸 Found screenshots section at scroll position', i);
        await page.screenshot({ path: 'full_test_09_screenshots_found.png' });
        
        // Take a few more to capture the full section
        await page.evaluate(() => window.scrollBy(0, 200));
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: 'full_test_10_screenshots_detail.png' });
        break;
      }
    }
    
    // Full page screenshot
    await page.screenshot({ path: 'full_test_fullpage.png', fullPage: true });
    console.log('📸 Full page screenshot saved');
  }
  
  console.log('\n⏳ Keeping browser open for 20 seconds to observe...');
  await new Promise(r => setTimeout(r, 20000));
  
  await browser.close();
  console.log('\n✅ Test complete! Check full_test_*.png files');
}

fullVideoTest().catch(console.error);
