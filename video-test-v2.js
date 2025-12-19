const { chromium } = require('playwright');

(async () => {
  console.log('Starting...');
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Home loaded');
  
  // Select Video mode - click on the dropdown trigger
  await page.click('text=Images');
  await page.waitForTimeout(1000);
  
  // Click on Video option
  const videoOption = await page.locator('text=Video').nth(0);
  await videoOption.click();
  await page.waitForTimeout(1000);
  console.log('Video mode selected');
  
  await page.screenshot({ path: 'vtest2-1-video-mode.png', fullPage: true });
  
  // Upload video file directly to hidden input
  const videoInputs = await page.locator('input[accept="video/*"]').all();
  console.log('Found video inputs:', videoInputs.length);
  
  if (videoInputs.length > 0) {
    await videoInputs[0].setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    console.log('File set on input');
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'vtest2-2-uploaded.png', fullPage: true });
  
  // Click analyze button
  const analyzeBtn = page.locator('button:has-text("Analyze")');
  const isDisabled = await analyzeBtn.isDisabled();
  console.log('Analyze button disabled:', isDisabled);
  
  if (!isDisabled) {
    console.log('Clicking Analyze...');
    await analyzeBtn.click();
    
    // Wait for navigation
    console.log('Waiting for results...');
    try {
      await page.waitForURL('**/results/**', { timeout: 120000 });
      console.log('Navigated to results!');
    } catch (e) {
      console.log('Navigation timeout');
    }
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'vtest2-3-results.png', fullPage: true });
  
  // Scroll and capture
  for (let y = 0; y <= 2400; y += 600) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `vtest2-scroll-${y}.png` });
  }
  
  await browser.close();
  console.log('Done!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
