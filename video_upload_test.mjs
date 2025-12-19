import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testVideoUpload() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('AutoScreenshots') || text.includes('keypoint') || text.includes('Crop')) {
      console.log('🔧 PAGE:', text);
    }
  });
  
  // Go to the home page
  console.log('📍 Navigating to home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot of home
  await page.screenshot({ path: 'video_test_1_home.png' });
  console.log('📸 Home page');
  
  // Look for video selector - click on dropdown to select Video
  try {
    // Find the media type dropdown button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent);
      if (text && (text.includes('Images') || text.includes('Video'))) {
        console.log('Found media selector button:', text);
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        break;
      }
    }
    
    await page.screenshot({ path: 'video_test_2_dropdown.png' });
    
    // Click on Video option
    const videoOption = await page.$('button:has(div:contains("Video"))');
    if (videoOption) {
      await videoOption.click();
    } else {
      // Try finding by text
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.evaluate(el => el.textContent);
        if (text && text.includes('Video') && text.includes('10-second')) {
          await btn.click();
          console.log('Clicked Video option');
          break;
        }
      }
    }
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'video_test_3_video_selected.png' });
    
  } catch (e) {
    console.log('Dropdown interaction:', e.message);
  }
  
  // Find file input and upload the test video
  const testVideoPath = path.join(__dirname, 'test 1.mp4');
  console.log('📹 Looking for file input to upload:', testVideoPath);
  
  try {
    // Find file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(testVideoPath);
      console.log('✅ Video file uploaded');
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'video_test_4_uploaded.png' });
    } else {
      console.log('❌ No file input found');
    }
  } catch (e) {
    console.log('File upload error:', e.message);
  }
  
  // Click analyze button
  try {
    const analyzeBtn = await page.$('button:has-text("Analyze")');
    if (!analyzeBtn) {
      // Find by looking for button with Analyze text
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.evaluate(el => el.textContent);
        if (text && text.includes('Analyze')) {
          const isDisabled = await btn.evaluate(el => el.disabled);
          if (!isDisabled) {
            console.log('Clicking Analyze button...');
            await btn.click();
            break;
          }
        }
      }
    }
    
    console.log('⏳ Waiting for analysis to complete...');
    await new Promise(r => setTimeout(r, 30000)); // Wait 30 seconds for analysis
    
    await page.screenshot({ path: 'video_test_5_after_analysis.png' });
    
  } catch (e) {
    console.log('Analyze button error:', e.message);
  }
  
  // Check current URL
  const url = page.url();
  console.log('Current URL:', url);
  
  // If we're on results page, scroll to find screenshots
  if (url.includes('results')) {
    console.log('📍 On results page, looking for screenshots...');
    
    // Scroll and take screenshots
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `video_test_scroll_${i}.png` });
      
      // Check if we can see "Key Point Analysis" or screenshots
      const pageContent = await page.content();
      if (pageContent.includes('Key Point Analysis') || pageContent.includes('Hands & Release')) {
        console.log('📸 Found screenshots section!');
        await page.screenshot({ path: 'video_test_screenshots_found.png' });
        break;
      }
    }
    
    // Take full page screenshot
    await page.screenshot({ path: 'video_test_fullpage.png', fullPage: true });
  }
  
  console.log('⏳ Keeping browser open for 15 seconds to observe...');
  await new Promise(r => setTimeout(r, 15000));
  
  await browser.close();
  console.log('✅ Done!');
}

testVideoUpload().catch(console.error);
