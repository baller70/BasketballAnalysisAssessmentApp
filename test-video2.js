const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  // Go to home page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  console.log('Home page loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'v2-step1-home.png', fullPage: true });
  
  // Click on the SELECT MEDIA TYPE dropdown
  const dropdown = await page.locator('[class*="dropdown"], [role="listbox"], select, .cursor-pointer').filter({ hasText: 'Images' }).first();
  
  // Try clicking on the Images text/button to open dropdown
  await page.click('text=Images');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'v2-step2-dropdown-open.png', fullPage: true });
  
  // Try to find and click Video option
  const videoOption = await page.locator('text=Video').first();
  if (await videoOption.isVisible()) {
    await videoOption.click();
    console.log('Clicked Video option');
  } else {
    // Try alternative - look for dropdown items
    const dropdownItems = await page.locator('[role="option"], [class*="option"], [class*="menu-item"]').all();
    console.log('Found dropdown items:', dropdownItems.length);
    for (const item of dropdownItems) {
      const text = await item.textContent();
      console.log('Item:', text);
      if (text?.toLowerCase().includes('video')) {
        await item.click();
        break;
      }
    }
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'v2-step3-video-selected.png', fullPage: true });
  
  // Now look for video file input
  const fileInputs = await page.locator('input[type="file"]').all();
  console.log('Found file inputs:', fileInputs.length);
  
  // Upload video
  if (fileInputs.length > 0) {
    await fileInputs[0].setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
    console.log('Video file set');
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'v2-step4-video-uploaded.png', fullPage: true });
  
  // Click analyze button
  const analyzeBtn = await page.locator('button:has-text("Analyze")').first();
  if (await analyzeBtn.isVisible()) {
    console.log('Clicking Analyze button');
    await analyzeBtn.click();
  }
  
  // Wait for analysis - video takes longer
  console.log('Waiting for video analysis...');
  await page.waitForTimeout(60000);
  
  await page.screenshot({ path: 'v2-step5-results.png', fullPage: true });
  
  // Check current URL
  const url = page.url();
  console.log('Current URL:', url);
  
  // Scroll through results
  for (let y = 0; y < 2400; y += 600) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `v2-scroll-${y}.png`, fullPage: false });
  }
  
  await browser.close();
})();
