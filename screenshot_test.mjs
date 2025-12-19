import puppeteer from 'puppeteer';

async function captureScreenshots() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Go to the app
  console.log('📍 Navigating to app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'browser_test_1_home.png', fullPage: false });
  console.log('📸 Screenshot 1: Home page saved');
  
  // Wait a moment
  await new Promise(r => setTimeout(r, 2000));
  
  // Check if there's a dropdown for video/image selection
  console.log('🔍 Looking for media type selector...');
  
  // Take a screenshot of current state
  await page.screenshot({ path: 'browser_test_2_current.png', fullPage: true });
  console.log('📸 Screenshot 2: Full page saved');
  
  // Try to find and click on Video option if available
  try {
    // Look for the dropdown button
    const dropdownBtn = await page.$('button:has-text("Images")') || await page.$('button:has-text("Video")');
    if (dropdownBtn) {
      await dropdownBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: 'browser_test_3_dropdown.png' });
      console.log('📸 Screenshot 3: Dropdown opened');
    }
  } catch (e) {
    console.log('Could not find dropdown:', e.message);
  }
  
  // Check if we're on results page or need to navigate there
  const url = page.url();
  console.log('Current URL:', url);
  
  // Navigate to results/demo to see the analysis
  console.log('📍 Navigating to results page...');
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  
  await page.screenshot({ path: 'browser_test_4_results.png', fullPage: false });
  console.log('📸 Screenshot 4: Results page saved');
  
  // Scroll down to find the screenshots section
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'browser_test_5_scrolled.png', fullPage: false });
  console.log('📸 Screenshot 5: Scrolled view saved');
  
  // Scroll more
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'browser_test_6_more_scroll.png', fullPage: false });
  console.log('📸 Screenshot 6: More scrolled saved');
  
  // Look for "Key Point Analysis" section
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'browser_test_7_screenshots_section.png', fullPage: false });
  console.log('📸 Screenshot 7: Screenshots section saved');
  
  // Get full page screenshot
  await page.screenshot({ path: 'browser_test_fullpage.png', fullPage: true });
  console.log('📸 Full page screenshot saved');
  
  // Log console messages from the page
  page.on('console', msg => {
    if (msg.text().includes('AutoScreenshots')) {
      console.log('🔧 Browser console:', msg.text());
    }
  });
  
  // Keep browser open for a moment to see
  console.log('⏳ Keeping browser open for 10 seconds...');
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
  console.log('✅ Done! Check the browser_test_*.png files');
}

captureScreenshots().catch(console.error);
