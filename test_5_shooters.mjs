import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing ALL 5 MATCHED SHOOTERS...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1200 }
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
  
  // Scroll to bottom to see matched shooters
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/five_shooters.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/five_shooters.png');
  
  // Count the matched shooter cards
  const shooterInfo = await page.evaluate(() => {
    // Look for the rank badges (1, 2, 3, 4, 5)
    const rankBadges = document.querySelectorAll('[class*="rounded-full"][class*="flex"][class*="items-center"]');
    let shooterCount = 0;
    const shooterNames = [];
    
    // Find all shooter cards in the matched shooters section
    const cards = document.querySelectorAll('[class*="bg-\\[\\#2a2a2a\\]"][class*="rounded-lg"][class*="p-4"]');
    
    // Look for shooter names - they should be in h4 tags with specific styling
    const h4Elements = document.querySelectorAll('h4');
    h4Elements.forEach(h4 => {
      const text = h4.textContent;
      // Check if this looks like a shooter name (contains known names or has the right styling)
      if (text && (
        text.includes('Curry') || 
        text.includes('Korver') || 
        text.includes('Allen') ||
        text.includes('Thompson') ||
        text.includes('Miller') ||
        text.includes('Booker') ||
        text.includes('Durant') ||
        text.includes('Lillard') ||
        text.includes('Tatum') ||
        text.includes('Mitchell') ||
        text.includes('Harris') ||
        text.includes('Green') ||
        text.includes('Robinson') ||
        text.includes('Love') ||
        text.includes('Ingles') ||
        text.includes('Smart') ||
        text.includes('Holiday') ||
        text.includes('Tucker') ||
        text.includes('Crowder') ||
        text.includes('Simmons') ||
        text.includes('Westbrook') ||
        text.includes('Williamson') ||
        text.includes('Giannis') ||
        text.includes('Ball') ||
        text.includes('Gobert') ||
        text.includes('Howard') ||
        text.includes('Capela') ||
        text.includes('Drummond') ||
        text.includes('Adams')
      )) {
        shooterNames.push(text);
        shooterCount++;
      }
    });
    
    // Also check for "Top 5 Matched Shooters" title
    const hasTitle = document.body.innerText.includes('Top 5 Matched Shooters');
    
    // Check for match percentages
    const matchPercentages = document.body.innerText.match(/\d+%\s*Match/g) || [];
    
    return {
      hasTitle,
      shooterCount,
      shooterNames,
      matchPercentagesFound: matchPercentages.length,
      matchPercentages: matchPercentages.slice(0, 5)
    };
  });
  
  console.log('📊 Shooter Info:', JSON.stringify(shooterInfo, null, 2));
  
  console.log('🔍 Browser is open - check the window');
  await new Promise(() => {});
})();
