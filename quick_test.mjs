import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ 
  headless: false, 
  args: ['--window-size=1400,1000'] 
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });

console.log('Going to home page...');
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });

await new Promise(r => setTimeout(r, 2000));

// Click on VIDEO in the dropdown
console.log('Switching to video mode...');
const dropdown = await page.$('button[class*="rounded-lg"]');
if (dropdown) {
  await dropdown.click();
  await new Promise(r => setTimeout(r, 500));
  
  // Find and click Video option
  const videoOption = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent?.includes('Video'));
  });
  if (videoOption.asElement()) {
    await videoOption.asElement().click();
    console.log('Clicked Video option');
  }
}

await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: '/tmp/quick_test_1.png', fullPage: false });

// Upload the test video
console.log('Uploading test video...');
const fileInput = await page.$('input[type="file"][accept*="video"]');
if (fileInput) {
  await fileInput.uploadFile('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
  console.log('Video uploaded');
} else {
  console.log('No video file input found');
}

await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: '/tmp/quick_test_2.png', fullPage: false });

// Click analyze button
console.log('Looking for analyze button...');
const analyzeBtn = await page.evaluateHandle(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(b => b.textContent?.toLowerCase().includes('analyze'));
});
if (analyzeBtn.asElement()) {
  await analyzeBtn.asElement().click();
  console.log('Clicked analyze button');
} else {
  console.log('Analyze button not found');
}

// Wait for analysis to complete
console.log('Waiting for analysis (up to 3 minutes)...');
for (let i = 0; i < 36; i++) {
  await new Promise(r => setTimeout(r, 5000));
  
  // Check if we're on results page
  const url = page.url();
  if (url.includes('results')) {
    console.log('Reached results page!');
    break;
  }
  console.log(`Still processing... ${(i+1)*5}s`);
}

await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: '/tmp/quick_test_3.png', fullPage: true });

console.log('Screenshots saved to /tmp/quick_test_*.png');
console.log('Browser staying open for 30 seconds...');
await new Promise(r => setTimeout(r, 30000));
await browser.close();












