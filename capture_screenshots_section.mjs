import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function captureScreenshotsSection() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('AutoScreenshots') || text.includes('Crop') || text.includes('keypoint')) {
      console.log('🔧', text);
    }
  });
  
  // Step 1: Go to home and upload video
  console.log('📍 Step 1: Home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Step 2: Select Video mode
  console.log('📍 Step 2: Select Video mode...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent || '');
    if (text.includes('Images') && text.includes('Upload 3-7')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }
  
  const buttons2 = await page.$$('button');
  for (const btn of buttons2) {
    const text = await btn.evaluate(el => el.textContent || '');
    if (text.includes('Video') && text.includes('10-second')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }
  
  // Step 3: Upload video
  console.log('📍 Step 3: Upload video...');
  const testVideoPath = path.join(__dirname, 'test 1.mp4');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testVideoPath);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Step 4: Click Analyze
  console.log('📍 Step 4: Click Analyze...');
  const buttons3 = await page.$$('button');
  for (const btn of buttons3) {
    const text = await btn.evaluate(el => el.textContent || '');
    const isDisabled = await btn.evaluate(el => el.disabled);
    if (text.includes('Analyze') && !isDisabled) {
      await btn.click();
      break;
    }
  }
  
  // Step 5: Wait for results
  console.log('📍 Step 5: Waiting for results...');
  await page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Current URL:', page.url());
  
  // Step 6: Scroll to find KEY POINT ANALYSIS section and take detailed screenshots
  console.log('📍 Step 6: Finding screenshots section...');
  
  let foundSection = false;
  for (let scroll = 0; scroll < 20; scroll++) {
    await page.evaluate(() => window.scrollBy(0, 300));
    await new Promise(r => setTimeout(r, 300));
    
    const content = await page.content();
    if (content.includes('KEY POINT ANALYSIS') || content.includes('Key Point Analysis')) {
      console.log('✅ Found KEY POINT ANALYSIS section!');
      foundSection = true;
      
      // Scroll a bit more to center the section
      await page.evaluate(() => window.scrollBy(0, -100));
      await new Promise(r => setTimeout(r, 500));
      
      // Take screenshot of just this section
      await page.screenshot({ path: 'screenshots_section_view.png' });
      console.log('📸 Screenshots section captured');
      break;
    }
  }
  
  if (!foundSection) {
    console.log('❌ Could not find KEY POINT ANALYSIS section');
    await page.screenshot({ path: 'screenshots_not_found.png', fullPage: true });
  }
  
  // Try to click on one of the screenshot cards to see it expanded
  console.log('📍 Step 7: Clicking on a screenshot card...');
  try {
    // Find clickable cards with screenshot images
    const allDivs = await page.$$('div[class*="cursor-pointer"]');
    console.log(`Found ${allDivs.length} clickable divs`);
    
    for (const div of allDivs) {
      const text = await div.evaluate(el => el.textContent || '');
      if (text.includes('Hands') || text.includes('Core') || text.includes('Legs')) {
        console.log('Clicking on:', text.substring(0, 30));
        await div.click();
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'screenshot_expanded.png' });
        console.log('📸 Expanded screenshot captured');
        
        // Press Escape to close
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 500));
        break;
      }
    }
  } catch (e) {
    console.log('Click error:', e.message);
  }
  
  console.log('\n⏳ Keeping browser open for 20 seconds...');
  await new Promise(r => setTimeout(r, 20000));
  
  await browser.close();
  console.log('✅ Done!');
}

captureScreenshotsSection().catch(console.error);
