import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
  
  // Click Historical Data tab
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('HISTORICAL')) {
      await btn.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Get all text content
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('=== Historical Data Tab Content ===');
  console.log(pageText.substring(0, 3000));
  
  await browser.close();
})();
