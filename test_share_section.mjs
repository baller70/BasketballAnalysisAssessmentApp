import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing SHARE SECTION on RESULTS PAGE with Kyle Korver...');
  
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
  
  // Scroll down to see share section
  await page.evaluate(() => {
    window.scrollBy(0, 800);
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/share_section.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/share_section.png');
  
  // Check for share section elements
  const shareInfo = await page.evaluate(() => {
    const text = document.body.innerText;
    
    return {
      hasShareTitle: text.includes('Share Your Results'),
      hasTwitter: text.includes('Twitter'),
      hasFacebook: text.includes('Facebook'),
      hasLinkedIn: text.includes('LinkedIn'),
      hasDownload: text.includes('Download'),
      hasCopyLink: text.includes('Copy Link'),
      hasShareResults: text.includes('Share Results'),
      // Check for matched shooters above
      hasStephenCurry: text.includes('Stephen Curry'),
      hasKyleKorver: text.includes('Kyle Korver'),
      hasDevinBooker: text.includes('Devin Booker'),
    };
  });
  
  console.log('📊 Share Section Check:', JSON.stringify(shareInfo, null, 2));
  
  console.log('🔍 Browser is open - check the RESULTS page');
  await new Promise(() => {});
})();
