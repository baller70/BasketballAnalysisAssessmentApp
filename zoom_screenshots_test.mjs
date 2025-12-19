import puppeteer from 'puppeteer';

async function zoomScreenshotsTest() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('AutoScreenshots') || text.includes('Crop')) {
      console.log('🔧', text);
    }
  });
  
  // Go directly to results page (session should still be there)
  console.log('📍 Going to results page...');
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  
  // Scroll to the screenshots section
  console.log('📍 Looking for screenshots section...');
  
  // Find and scroll to "Key Point Analysis" section
  await page.evaluate(() => {
    const elements = document.querySelectorAll('h3, h4');
    for (const el of elements) {
      if (el.textContent.includes('Key Point') || el.textContent.includes('KEY POINT')) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return true;
      }
    }
    // Fallback - scroll down
    window.scrollTo(0, 2000);
    return false;
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'zoom_test_screenshots_section.png' });
  console.log('📸 Screenshots section captured');
  
  // Click on each screenshot to expand and see it better
  const screenshots = await page.$$('[class*="rounded-lg"][class*="border"]');
  console.log(`Found ${screenshots.length} potential screenshot cards`);
  
  // Try to find and click on the first screenshot card
  try {
    // Look for cards with "Hands" or "Core" or "Legs" text
    const cards = await page.$$('div');
    for (const card of cards) {
      const text = await card.evaluate(el => el.textContent || '');
      const classList = await card.evaluate(el => el.className || '');
      
      if ((text.includes('Hands & Release') || text.includes('Core & Shoulders') || text.includes('Legs & Base')) 
          && classList.includes('cursor-pointer')) {
        console.log('Found screenshot card:', text.substring(0, 50));
        await card.click();
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'zoom_test_expanded_screenshot.png' });
        console.log('📸 Expanded screenshot captured');
        
        // Close modal
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 500));
        break;
      }
    }
  } catch (e) {
    console.log('Click error:', e.message);
  }
  
  // Get the actual crop values from console
  console.log('\n📊 Checking crop dimensions from page console...');
  
  // Keep browser open to observe
  console.log('\n⏳ Keeping browser open for 30 seconds...');
  await new Promise(r => setTimeout(r, 30000));
  
  await browser.close();
  console.log('✅ Done!');
}

zoomScreenshotsTest().catch(console.error);
