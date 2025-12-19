import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testAllScreenshots() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 1000 }
  });
  
  const page = await browser.newPage();
  
  // Step 1: Upload and analyze
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Select Video mode
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent || '');
    if (text.includes('Images') && text.includes('Upload 3-7')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }
  
  const buttons2 = await page.$$('button');
  for (const btn of buttons2) {
    const text = await btn.evaluate(el => el.textContent || '');
    if (text.includes('Video') && text.includes('10-second')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }
  
  // Upload video
  const testVideoPath = path.join(__dirname, 'test 1.mp4');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testVideoPath);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Click Analyze
  const buttons3 = await page.$$('button');
  for (const btn of buttons3) {
    const text = await btn.evaluate(el => el.textContent || '');
    const isDisabled = await btn.evaluate(el => el.disabled);
    if (text.includes('Analyze') && !isDisabled) {
      await btn.click();
      break;
    }
  }
  
  // Wait for results
  await page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 8000));
  
  // Scroll to screenshots section
  await page.evaluate(() => {
    const elements = document.querySelectorAll('h3, h4');
    for (const el of elements) {
      if (el.textContent.includes('Key Point') || el.textContent.includes('KEY POINT')) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot of the section
  await page.screenshot({ path: 'final_screenshots_section.png' });
  console.log('📸 Section screenshot saved');
  
  // Click on each screenshot card and capture
  const screenshotNames = ['Hands & Release', 'Core & Shoulders', 'Legs & Base'];
  
  for (let i = 0; i < screenshotNames.length; i++) {
    const name = screenshotNames[i];
    console.log(`\n📍 Clicking on ${name}...`);
    
    // Find and click the card
    const cards = await page.$$('div[class*="cursor-pointer"]');
    for (const card of cards) {
      const text = await card.evaluate(el => el.textContent || '');
      if (text.includes(name)) {
        await card.click();
        await new Promise(r => setTimeout(r, 1500));
        
        // Verify modal title
        const modalTitle = await page.evaluate(() => {
          const titleEl = document.querySelector('[class*="text-\\[\\#FFD700\\]"]');
          return titleEl ? titleEl.textContent : 'No title found';
        });
        console.log(`   Modal shows: ${modalTitle}`);
        
        // Take screenshot of expanded view
        await page.screenshot({ path: `final_expanded_${i + 1}_${name.replace(/ /g, '_')}.png` });
        console.log(`📸 Expanded ${name} saved`);
        
        // Close modal by clicking the X button
        const closeBtn = await page.$('button svg[class*="w-6"]');
        if (closeBtn) {
          const parent = await closeBtn.evaluateHandle(el => el.closest('button'));
          await parent.click();
        } else {
          // Fallback: click the backdrop
          await page.evaluate(() => {
            const backdrop = document.querySelector('[class*="fixed inset-0"]');
            if (backdrop) backdrop.click();
          });
        }
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }
  }
  
  console.log('\n✅ Done!');
  await browser.close();
}

testAllScreenshots().catch(console.error);
