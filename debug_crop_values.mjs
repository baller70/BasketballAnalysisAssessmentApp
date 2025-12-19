import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function debugCropValues() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console logs with full object details
  page.on('console', async msg => {
    const args = msg.args();
    const text = msg.text();
    
    // For keypoint logs, try to get the actual values
    if (text.includes('AutoScreenshots') || text.includes('keypoint') || text.includes('Crop') || text.includes('bounds')) {
      let fullMessage = text;
      for (const arg of args) {
        try {
          const val = await arg.jsonValue();
          if (typeof val === 'object') {
            fullMessage += ' ' + JSON.stringify(val, null, 2);
          }
        } catch (e) {
          // Ignore
        }
      }
      console.log('📋', fullMessage);
    }
  });
  
  // Step 1: Go to home and upload video
  console.log('📍 Step 1: Home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Step 2: Select Video mode
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
  const testVideoPath = path.join(__dirname, 'test 1.mp4');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testVideoPath);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Step 4: Click Analyze
  const buttons3 = await page.$$('button');
  for (const btn of buttons3) {
    const text = await btn.evaluate(el => el.textContent || '');
    const isDisabled = await btn.evaluate(el => el.disabled);
    if (text.includes('Analyze') && !isDisabled) {
      await btn.click();
      break;
    }
  }
  
  // Step 5: Wait for results and capture logs
  console.log('📍 Waiting for results and crop values...');
  await page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 15000));
  
  await browser.close();
  console.log('✅ Done!');
}

debugCropValues().catch(console.error);
