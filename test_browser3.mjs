import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting browser test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console logs
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });
  
  console.log('📍 Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  
  const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/shooter1.jpg';
  
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testImage);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Analyze')) {
      await btn.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 15000));
  
  // Check canvas state
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, 10, 10);
      const hasContent = imageData.data.some(v => v > 0);
      return {
        found: true,
        width: canvas.width,
        height: canvas.height,
        hasContent,
        style: canvas.style.cssText,
        className: canvas.className
      };
    }
    return { found: false };
  });
  console.log('📊 Canvas info:', JSON.stringify(canvasInfo, null, 2));
  
  await page.screenshot({ path: '/tmp/step4_final.png', fullPage: true });
  console.log('✅ Done');
  
  await new Promise(() => {});
})();
