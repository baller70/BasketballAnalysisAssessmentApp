import puppeteer from 'puppeteer';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 } 
  });
  const page = await browser.newPage();
  
  console.log('Opening app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await delay(2000);
  
  // Find file input - it might be hidden
  console.log('Looking for file input...');
  const fileInputs = await page.$$('input[type="file"]');
  console.log(`Found ${fileInputs.length} file inputs`);
  
  if (fileInputs.length === 0) {
    // Try clicking upload area first
    console.log('Clicking upload area...');
    await page.evaluate(() => {
      const uploadArea = document.querySelector('[class*="upload"], [class*="dropzone"], label[for]');
      if (uploadArea) uploadArea.click();
    });
    await delay(1000);
  }
  
  // Try again
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('Uploading Kyle Korver image...');
    await fileInput.uploadFile('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg');
    await delay(3000);
    
    console.log('Clicking analyze button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = buttons.find(b => b.textContent.toLowerCase().includes('analyze'));
      if (analyzeBtn) {
        console.log('Found analyze button:', analyzeBtn.textContent);
        analyzeBtn.click();
      }
    });
    
    console.log('Waiting for analysis to complete...');
    await delay(25000);
    
    console.log('Current URL:', page.url());
    await page.screenshot({ path: '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/label_positioning_test.png' });
    console.log('Screenshot saved to label_positioning_test.png');
  } else {
    console.log('Could not find file input. Taking screenshot of current state...');
    await page.screenshot({ path: '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/current_state.png' });
  }
  
  console.log('Done! Browser staying open for manual inspection.');
})();


