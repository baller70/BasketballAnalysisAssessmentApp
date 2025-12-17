import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing SESSION GALLERY with Kyle Korver...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Session') || text.includes('saved') || text.includes('localStorage')) {
      console.log(`[BROWSER] ${text}`);
    }
  });
  
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
  await page.screenshot({ path: '/tmp/session_gallery.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/session_gallery.png');
  
  // Check for session gallery elements
  const galleryInfo = await page.evaluate(() => {
    const sessionGallery = document.querySelector('[class*="Session Gallery"]') || 
                          document.evaluate("//h2[contains(text(), 'Session Gallery')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    const sessionCards = document.querySelectorAll('[class*="flex-shrink-0"][class*="w-28"]');
    const mainImage = document.querySelector('[class*="h-\\[300px\\]"]');
    
    return {
      hasGalleryTitle: !!sessionGallery,
      sessionCardCount: sessionCards.length,
      hasMainImage: !!mainImage
    };
  });
  console.log('📊 Gallery info:', JSON.stringify(galleryInfo, null, 2));
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
