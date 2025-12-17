import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing SESSION CAROUSEL with Kyle Korver...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log('✅ Home page loaded');
  
  // Use OFFICIAL Kyle Korver test image
  const testImage = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg';
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testImage);
    console.log('✅ Kyle Korver image uploaded');
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Click Analyze
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Analyze')) {
      await btn.click();
      console.log('✅ Analyze button clicked');
      break;
    }
  }
  
  // Wait for analysis
  console.log('⏳ Waiting for analysis...');
  await new Promise(r => setTimeout(r, 20000));
  
  // Click on PLAYER ASSESSMENT tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('PLAYER ASSESSMENT')) {
      await tab.click();
      console.log('✅ Clicked PLAYER ASSESSMENT tab');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/carousel.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/carousel.png');
  
  // Check for carousel elements
  const carouselInfo = await page.evaluate(() => {
    const text = document.body.innerText;
    
    return {
      hasSessionGallery: text.includes('Session Gallery'),
      hasScrollToBrowse: text.includes('Scroll to browse') || text.includes('session'),
      hasDropdown: document.querySelector('select') !== null,
      hasArrowButtons: document.querySelectorAll('button svg').length > 0,
      hasDots: document.querySelectorAll('[class*="rounded-full"][class*="bg-"]').length > 0,
    };
  });
  
  console.log('📊 Carousel Check:', JSON.stringify(carouselInfo, null, 2));
  
  console.log('🔍 Browser is open - check the PLAYER ASSESSMENT tab carousel');
  await new Promise(() => {});
})();
