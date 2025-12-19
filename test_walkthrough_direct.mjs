import puppeteer from 'puppeteer';

(async () => {
  console.log('Testing Animated Walkthrough on Results Page...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Go directly to results page (demo mode)
  console.log('1. Navigating to results page...');
  await page.goto('http://localhost:3000/results/demo', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  
  // Take screenshot
  await page.screenshot({ path: 'test_walkthrough_1_results.png', fullPage: false });
  console.log('   Screenshot: test_walkthrough_1_results.png');
  
  // Scroll down to find animated walkthrough
  console.log('2. Scrolling to find Animated Walkthrough...');
  await page.evaluate(() => {
    window.scrollBy(0, 600);
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'test_walkthrough_2_scrolled.png', fullPage: false });
  console.log('   Screenshot: test_walkthrough_2_scrolled.png');
  
  // Check for animated walkthrough
  const hasWalkthrough = await page.evaluate(() => {
    return document.body.innerText.includes('Animated Form Walkthrough');
  });
  console.log('3. Has Animated Form Walkthrough:', hasWalkthrough);
  
  if (hasWalkthrough) {
    // Scroll more to center it
    await page.evaluate(() => {
      const element = Array.from(document.querySelectorAll('h3')).find(el => el.innerText.includes('Animated Form Walkthrough'));
      if (element) {
        element.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.screenshot({ path: 'test_walkthrough_3_found.png', fullPage: false });
    console.log('   Screenshot: test_walkthrough_3_found.png');
    
    // Find and click play button
    const playClicked = await page.evaluate(() => {
      const playIcon = document.querySelector('path[d="M8 5v14l11-7z"]');
      if (playIcon) {
        const btn = playIcon.closest('button');
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    if (playClicked) {
      console.log('4. Clicked play button!');
      
      // Take screenshots during animation
      console.log('5. Capturing animation frames...');
      
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: 'test_walkthrough_4_fullview.png', fullPage: false });
      console.log('   Frame 1: Full view');
      
      await new Promise(r => setTimeout(r, 2500));
      await page.screenshot({ path: 'test_walkthrough_5_zoom1.png', fullPage: false });
      console.log('   Frame 2: First zoom');
      
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'test_walkthrough_6_zoom2.png', fullPage: false });
      console.log('   Frame 3: Second annotation');
      
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'test_walkthrough_7_zoom3.png', fullPage: false });
      console.log('   Frame 4: Third annotation');
      
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'test_walkthrough_8_zoom4.png', fullPage: false });
      console.log('   Frame 5: Fourth annotation');
      
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'test_walkthrough_9_final.png', fullPage: false });
      console.log('   Frame 6: Final');
      
      console.log('   Animation screenshots captured!');
    } else {
      console.log('4. Could not find play button');
    }
  } else {
    console.log('   Animated Walkthrough not found on page');
    // Take full page screenshot
    await page.screenshot({ path: 'test_walkthrough_fullpage.png', fullPage: true });
    console.log('   Full page screenshot saved');
  }
  
  console.log('\n6. Test complete. Keeping browser open for 60 seconds...');
  await new Promise(r => setTimeout(r, 60000));
  await browser.close();
})();


