import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Log EVERYTHING
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.text()}`);
  });
  
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
  
  console.log('⏳ Waiting for analysis...');
  await new Promise(r => setTimeout(r, 20000));
  
  // Check canvas content
  const canvasCheck = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };
    
    const ctx = canvas.getContext('2d');
    // Check multiple points for content
    const points = [
      ctx.getImageData(100, 100, 1, 1).data,
      ctx.getImageData(250, 250, 1, 1).data,
      ctx.getImageData(50, 50, 1, 1).data
    ];
    
    return {
      width: canvas.width,
      height: canvas.height,
      point1: Array.from(points[0]),
      point2: Array.from(points[1]),
      point3: Array.from(points[2]),
      hasAnyContent: points.some(p => p[0] > 0 || p[1] > 0 || p[2] > 0)
    };
  });
  
  console.log('📊 Canvas check:', JSON.stringify(canvasCheck, null, 2));
  
  await page.screenshot({ path: '/tmp/final_test.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/final_test.png');
  
  await new Promise(() => {});
})();
