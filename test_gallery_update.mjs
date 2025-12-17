import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing UPDATED SESSION GALLERY with Kyle Korver...');
  
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
  await page.screenshot({ path: '/tmp/gallery_redesign.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/gallery_redesign.png');
  
  // Check for new layout elements
  const layoutInfo = await page.evaluate(() => {
    // Check for large main image
    const mainImage = document.querySelector('[style*="min-height: 450px"]');
    // Check for confidence/keypoints row
    const confidenceText = document.body.innerText.includes('Confidence');
    const keypointsText = document.body.innerText.includes('Keypoints Detected');
    // Check for joint angles table
    const jointAnglesText = document.body.innerText.includes('Joint Angles');
    // Check for 3 screenshots
    const screenshotLabels = ['Ball & Hands', 'Shoulder & Arms', 'Legs & Base'];
    const hasAllScreenshots = screenshotLabels.every(label => document.body.innerText.includes(label));
    // Check SPAR categories (should only have 3 now)
    const sparCategories = document.body.innerText.match(/Shooting Form|Physical|Mechanics/g) || [];
    const removedCategories = document.body.innerText.match(/Shot Types|Consistency/g) || [];
    
    return {
      hasLargeMainImage: !!mainImage,
      hasConfidence: confidenceText,
      hasKeypoints: keypointsText,
      hasJointAngles: jointAnglesText,
      hasAllScreenshots,
      sparCategoriesFound: sparCategories.length,
      removedCategoriesFound: removedCategories.length
    };
  });
  
  console.log('📊 Layout check:', JSON.stringify(layoutInfo, null, 2));
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
