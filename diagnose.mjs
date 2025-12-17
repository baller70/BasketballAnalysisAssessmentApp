import puppeteer from 'puppeteer';

(async () => {
  console.log('🔍 Diagnosing website issues...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  try {
    // Test home page
    console.log('📄 Testing Home Page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   ✅ Home page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if main content is visible
    const homeContent = await page.evaluate(() => {
      return {
        hasHeader: !!document.querySelector('header'),
        hasUploadSection: document.body.innerText.includes('Upload'),
        hasForm: !!document.querySelector('form') || !!document.querySelector('input'),
        bodyLength: document.body.innerText.length
      };
    });
    console.log(`   Header: ${homeContent.hasHeader ? '✅' : '❌'}`);
    console.log(`   Upload Section: ${homeContent.hasUploadSection ? '✅' : '❌'}`);
    console.log(`   Form/Input: ${homeContent.hasForm ? '✅' : '❌'}`);
    console.log(`   Content length: ${homeContent.bodyLength} chars`);
    
    // Test results page
    console.log('\n📄 Testing Results Page...');
    await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   ✅ Results page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check results page content
    const resultsContent = await page.evaluate(() => {
      return {
        hasHeader: !!document.querySelector('header'),
        hasTabs: document.body.innerText.includes('BIOMECHANICAL') || document.body.innerText.includes('ANALYSIS'),
        hasPlayerCard: document.body.innerText.includes('OVR') || document.body.innerText.includes('KEVIN'),
        bodyLength: document.body.innerText.length,
        visibleText: document.body.innerText.substring(0, 500)
      };
    });
    console.log(`   Header: ${resultsContent.hasHeader ? '✅' : '❌'}`);
    console.log(`   Tabs: ${resultsContent.hasTabs ? '✅' : '❌'}`);
    console.log(`   Player Card: ${resultsContent.hasPlayerCard ? '✅' : '❌'}`);
    console.log(`   Content length: ${resultsContent.bodyLength} chars`);
    
    // Report errors
    if (errors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      errors.forEach(e => console.log(`   - ${e.substring(0, 200)}`));
    } else {
      console.log('\n✅ No console errors detected');
    }
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/website_diagnosis.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/website_diagnosis.png');
    
    console.log('\n🔍 Browser is open - please describe what looks broken!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await new Promise(() => {});
})();

