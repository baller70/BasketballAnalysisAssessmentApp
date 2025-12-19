import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function debugLabels() {
  console.log('Starting debug...')
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('Composite') || text.includes('AutoScreenshots')) {
      console.log('BROWSER:', text)
    }
  })
  
  await page.setViewport({ width: 1400, height: 900 })
  
  console.log('Navigating to app...')
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
  await sleep(2000)
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'debug_1_initial.png' })
  console.log('Screenshot 1: Initial state')
  
  // Click on Image mode
  console.log('Selecting Image mode...')
  const imageOption = await page.$('text=Image')
  if (imageOption) {
    await imageOption.click()
    await sleep(500)
  }
  
  // Upload the test image
  console.log('Uploading test image...')
  const fileInput = await page.$('input[type="file"]')
  if (fileInput) {
    const testImagePath = '/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/kyle_korver_test.jpg'
    await fileInput.uploadFile(testImagePath)
    await sleep(2000)
    await page.screenshot({ path: 'debug_2_uploaded.png' })
    console.log('Screenshot 2: Image uploaded')
  }
  
  // Click Analyze button
  console.log('Clicking Analyze...')
  const analyzeBtn = await page.$('button:has-text("Analyze")')
  if (analyzeBtn) {
    await analyzeBtn.click()
  } else {
    // Try other selectors
    const buttons = await page.$$('button')
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent)
      if (text && text.includes('Analyze')) {
        await btn.click()
        break
      }
    }
  }
  
  console.log('Waiting for analysis...')
  await sleep(10000)
  await page.screenshot({ path: 'debug_3_analysis.png' })
  console.log('Screenshot 3: After analysis')
  
  // Look for thumbnail cards to click
  console.log('Looking for thumbnail to expand...')
  const thumbnails = await page.$$('[class*="cursor-pointer"]')
  console.log(`Found ${thumbnails.length} clickable elements`)
  
  // Find and click a thumbnail (not the main body one)
  for (const thumb of thumbnails) {
    const text = await thumb.evaluate(el => el.textContent)
    if (text && (text.includes('Hands') || text.includes('Legs') || text.includes('Abs'))) {
      console.log('Clicking thumbnail:', text.substring(0, 50))
      await thumb.click()
      await sleep(3000)
      break
    }
  }
  
  await page.screenshot({ path: 'debug_4_expanded.png' })
  console.log('Screenshot 4: Thumbnail expanded')
  
  // Look for Labels toggle button
  console.log('Looking for Labels toggle...')
  const buttons = await page.$$('button')
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent)
    if (text && text.includes('Labels')) {
      console.log('Found Labels button, clicking...')
      await btn.click()
      await sleep(2000)
      break
    }
  }
  
  await page.screenshot({ path: 'debug_5_labels_on.png' })
  console.log('Screenshot 5: After Labels toggle')
  
  // Check console for errors
  await sleep(2000)
  
  // Get the current state of the image
  const imgSrc = await page.evaluate(() => {
    const img = document.querySelector('.max-w-full.rounded-lg')
    return img ? img.src.substring(0, 100) : 'NOT FOUND'
  })
  console.log('Image src starts with:', imgSrc)
  
  await page.screenshot({ path: 'debug_6_final.png' })
  console.log('Screenshot 6: Final state')
  
  console.log('\nDebug complete. Check the debug_*.png files.')
  console.log('Press Ctrl+C to close browser...')
  
  // Keep browser open for manual inspection
  await sleep(60000)
  
  await browser.close()
}

debugLabels().catch(console.error)

