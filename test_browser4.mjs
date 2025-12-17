import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 900 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🎨') || text.includes('🖼️') || text.includes('imageUrl') || text.includes('Failed')) {
      console.log(`[BROWSER] ${text}`);
    }
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
  
  await new Promise(r => setTimeout(r, 15000));
  
  // Check the imageUrl being passed
  const debugInfo = await page.evaluate(() => {
    // Look for the HybridSkeletonDisplay component's image
    const img = document.querySelector('canvas')?.previousSibling;
    
    // Check localStorage for the zustand persisted state
    const stored = localStorage.getItem('basketball-analysis-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        hasBase64: !!parsed?.state?.uploadedImageBase64,
        base64Length: parsed?.state?.uploadedImageBase64?.length || 0,
        base64Start: parsed?.state?.uploadedImageBase64?.substring(0, 50) || null
      };
    }
    return { error: 'No stored state' };
  });
  console.log('📊 Debug info:', JSON.stringify(debugInfo, null, 2));
  
  await page.screenshot({ path: '/tmp/step4_final.png', fullPage: true });
  console.log('✅ Done');
  
  await new Promise(() => {});
})();
