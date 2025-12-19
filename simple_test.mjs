import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ 
  headless: false, 
  args: ['--window-size=1400,1000'] 
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });

console.log('Going to results demo...');
await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 60000 });

await new Promise(r => setTimeout(r, 3000));

await page.screenshot({ path: '/tmp/simple_test.png', fullPage: true });
console.log('Screenshot saved to /tmp/simple_test.png');

console.log('Browser staying open for 60 seconds...');
await new Promise(r => setTimeout(r, 60000));
await browser.close();

