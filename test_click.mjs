import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1500, height: 1000 } });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
  console.log('✅ Page loaded');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Try clicking using different methods
  console.log('\n🖱️ Attempting to click HISTORICAL DATA tab...');
  
  // Method 1: Direct click on the button element
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const histBtn = buttons.find(b => b.textContent?.trim() === 'HISTORICAL DATA');
    if (histBtn) {
      console.log('Found button:', histBtn.textContent);
      histBtn.click();
      return true;
    }
    return false;
  });
  
  console.log(`   Direct click: ${clicked ? '✅' : '❌'}`);
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Check active tab
  let activeTab = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const active = buttons.find(b => 
      b.className.includes('FFD700') && 
      ['BIOMECHANICAL', 'IDENTIFIED', 'PLAYER', 'COMPARISON', 'TRAINING', 'HISTORICAL'].some(t => b.textContent?.includes(t))
    );
    return active?.textContent || 'none';
  });
  console.log(`   Active after direct click: ${activeTab}`);
  
  // Method 2: Use Puppeteer's click with waitForSelector
  console.log('\n🖱️ Trying Puppeteer click method...');
  try {
    await page.click('button:has-text("HISTORICAL DATA")');
  } catch (e) {
    // Try XPath
    const [histButton] = await page.$x("//button[contains(text(), 'HISTORICAL DATA')]");
    if (histButton) {
      await histButton.click();
      console.log('   XPath click: ✅');
    }
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  activeTab = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const active = buttons.find(b => 
      b.className.includes('FFD700') && 
      ['BIOMECHANICAL', 'IDENTIFIED', 'PLAYER', 'COMPARISON', 'TRAINING', 'HISTORICAL'].some(t => b.textContent?.includes(t))
    );
    return active?.textContent || 'none';
  });
  console.log(`   Active after Puppeteer click: ${activeTab}`);
  
  // Method 3: Scroll to button and click
  console.log('\n🖱️ Scrolling to button and clicking...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const histBtn = buttons.find(b => b.textContent?.trim() === 'HISTORICAL DATA');
    if (histBtn) {
      histBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  const [histButton] = await page.$x("//button[contains(text(), 'HISTORICAL DATA')]");
  if (histButton) {
    await histButton.click({ delay: 100 });
    console.log('   Clicked after scroll');
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  activeTab = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const active = buttons.find(b => 
      b.className.includes('FFD700') && 
      ['BIOMECHANICAL', 'IDENTIFIED', 'PLAYER', 'COMPARISON', 'TRAINING', 'HISTORICAL'].some(t => b.textContent?.includes(t))
    );
    return active?.textContent || 'none';
  });
  console.log(`   Active after scroll+click: ${activeTab}`);
  
  console.log('\n🔍 Browser open - manually try clicking the tab!');
  await new Promise(() => {});
})();
