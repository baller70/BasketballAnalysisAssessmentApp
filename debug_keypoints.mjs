import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function debugKeypoints() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console logs
  page.on('console', msg => {
    const text = msg.text();
    console.log('📋', text);
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
  await new Promise(r => setTimeout(r, 8000));
  
  console.log('\n\n⏳ Keeping browser open for 30 seconds to see debug output...');
  await new Promise(r => setTimeout(r, 30000));
  
  await browser.close();
  console.log('✅ Done!');
}

debugKeypoints().catch(console.error);
