/**
 * Quick test to verify video player with annotations
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const SCREENSHOTS_DIR = '/tmp/video_quick_test';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  console.log('🎬 Quick Video Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1500,1000', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000 });
  
  try {
    // Go directly to results demo page
    console.log('Opening results demo page...');
    await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle0', timeout: 60000 });
    
    await wait(2000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_initial.png`, fullPage: true });
    console.log('✅ Screenshot 1: Initial page');
    
    // Click on VIDEO tab if not already selected
    const videoTab = await page.$('button:has-text("VIDEO")');
    if (videoTab) {
      await videoTab.click();
      await wait(1000);
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_video_tab.png`, fullPage: true });
    console.log('✅ Screenshot 2: Video tab');
    
    // Look for play button and click it
    const playButton = await page.evaluateHandle(() => {
      // Find the large play button in the cover screen
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => {
        const svg = b.querySelector('svg');
        return svg && b.classList.contains('p-6'); // Large play button
      });
    });
    
    if (playButton) {
      const element = playButton.asElement();
      if (element) {
        console.log('Found play button, clicking...');
        await element.click();
        await wait(2000);
      }
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_after_play.png`, fullPage: true });
    console.log('✅ Screenshot 3: After clicking play');
    
    // Scroll down to see annotations and controls
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_scrolled.png`, fullPage: true });
    console.log('✅ Screenshot 4: Scrolled down');
    
    console.log('\n✅ Test complete! Screenshots in:', SCREENSHOTS_DIR);
    console.log('Browser staying open for 60 seconds...');
    await wait(60000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/error.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);

