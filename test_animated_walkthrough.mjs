import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Starting browser test for Animated Image Walkthrough...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Go to homepage
  console.log('1. Navigating to homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot of homepage
  await page.screenshot({ path: 'test_animated_1_homepage.png', fullPage: false });
  console.log('   Screenshot: test_animated_1_homepage.png');
  
  // Find test images
  console.log('2. Looking for test images...');
  const testImagePaths = [
    '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/real_shooter.jpg',
    '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/lillard_cropped.jpg',
    '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/training_data/v3_dataset/img_063.jpg'
  ];
  
  const existingImages = testImagePaths.filter(p => fs.existsSync(p));
  console.log('   Found', existingImages.length, 'test images');
  
  if (existingImages.length < 3) {
    console.log('   Need at least 3 images. Looking for more...');
    // Try to find more images in training_data
    const trainingDir = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/training_data/v3_dataset';
    if (fs.existsSync(trainingDir)) {
      const files = fs.readdirSync(trainingDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
      for (const f of files.slice(0, 5)) {
        const fullPath = path.join(trainingDir, f);
        if (!existingImages.includes(fullPath)) {
          existingImages.push(fullPath);
        }
        if (existingImages.length >= 3) break;
      }
    }
  }
  
  console.log('   Using images:', existingImages.slice(0, 3));
  
  if (existingImages.length < 3) {
    console.log('   ERROR: Need at least 3 images. Please upload manually.');
    await new Promise(r => setTimeout(r, 60000));
    await browser.close();
    return;
  }
  
  // Upload 3 images to separate inputs
  console.log('3. Uploading images...');
  const fileInputs = await page.$$('input[type="file"]');
  console.log('   Found', fileInputs.length, 'file inputs');
  
  // Upload to first 3 separate file inputs
  for (let i = 0; i < Math.min(3, fileInputs.length, existingImages.length); i++) {
    await fileInputs[i].uploadFile(existingImages[i]);
    console.log('   Uploaded image', i + 1);
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Take screenshot after upload
  await page.screenshot({ path: 'test_animated_2_uploaded.png', fullPage: false });
  console.log('   Screenshot: test_animated_2_uploaded.png');
  
  // Click the Analyze button
  console.log('4. Clicking Analyze button...');
  const analyzeClicked = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.innerText.includes('Analyze My Shooting Form')) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  
  if (analyzeClicked) {
    console.log('   Clicked Analyze button');
  } else {
    console.log('   Could not find Analyze button');
  }
  
  // Wait for processing
  console.log('5. Waiting for analysis to complete...');
  await new Promise(r => setTimeout(r, 15000));
  
  // Take screenshot
  await page.screenshot({ path: 'test_animated_3_processing.png', fullPage: false });
  console.log('   Screenshot: test_animated_3_processing.png');
  
  // Check current URL
  const url = page.url();
  console.log('6. Current URL:', url);
  
  if (url.includes('results')) {
    console.log('7. On results page - looking for Animated Walkthrough...');
    await page.screenshot({ path: 'test_animated_4_results.png', fullPage: true });
    console.log('   Screenshot: test_animated_4_results.png');
    
    // Scroll down to find the animated walkthrough
    await page.evaluate(() => {
      window.scrollBy(0, 800);
    });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: 'test_animated_5_scrolled.png', fullPage: false });
    console.log('   Screenshot: test_animated_5_scrolled.png');
    
    // Check for animated walkthrough text
    const hasWalkthrough = await page.evaluate(() => {
      return document.body.innerText.includes('Animated Form Walkthrough');
    });
    console.log('8. Has Animated Form Walkthrough:', hasWalkthrough);
    
    if (hasWalkthrough) {
      // Find play button and click it
      const playClicked = await page.evaluate(() => {
        // Try finding by the play icon path
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
        console.log('   Clicked play button!');
        
        // Take screenshots during animation
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'test_animated_6_playing1.png', fullPage: false });
        console.log('   Screenshot during animation: test_animated_6_playing1.png');
        
        await new Promise(r => setTimeout(r, 4000));
        await page.screenshot({ path: 'test_animated_7_playing2.png', fullPage: false });
        console.log('   Screenshot during animation: test_animated_7_playing2.png');
        
        await new Promise(r => setTimeout(r, 4000));
        await page.screenshot({ path: 'test_animated_8_playing3.png', fullPage: false });
        console.log('   Screenshot during animation: test_animated_8_playing3.png');
        
        await new Promise(r => setTimeout(r, 4000));
        await page.screenshot({ path: 'test_animated_9_playing4.png', fullPage: false });
        console.log('   Screenshot during animation: test_animated_9_playing4.png');
      } else {
        console.log('   Could not find play button');
      }
    }
  } else {
    console.log('   Not on results page yet - may need more time');
    await new Promise(r => setTimeout(r, 10000));
    const newUrl = page.url();
    console.log('   URL after waiting:', newUrl);
    await page.screenshot({ path: 'test_animated_final.png', fullPage: true });
  }
  
  console.log('\n9. Test complete. Keeping browser open for manual inspection...');
  console.log('   Close browser manually when done.');
  
  // Keep browser open
  await new Promise(r => setTimeout(r, 120000));
  await browser.close();
})();
