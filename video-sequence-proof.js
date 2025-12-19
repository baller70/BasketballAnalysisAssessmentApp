const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);

  // Go home
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Select Video mode
  await page.locator('button').filter({ hasText: 'Images' }).first().click();
  await page.waitForTimeout(400);
  await page.locator('button').filter({ hasText: 'Video' }).filter({ hasText: '10-second' }).first().click();
  await page.waitForTimeout(600);

  // Upload video
  await page.locator('input[accept="video/*"]').first().setInputFiles('/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/test 1.mp4');
  await page.waitForTimeout(1000);

  // Analyze
  await page.locator('button:has-text("Analyze My Shooting Form")').first().click();

  // Wait for results
  await page.waitForURL('**/results/**', { timeout: 180000 });
  await page.waitForTimeout(3000);

  // Ensure Video tab selected
  const videoTab = page.locator('button').filter({ hasText: /^video$/i }).first();
  if (await videoTab.count()) {
    await videoTab.click();
  }
  await page.waitForTimeout(800);

  // Scroll to the player header
  const header = page.locator('text=Video Frame-by-Frame Playback').first();
  await header.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Starter (paused)
  await page.screenshot({ path: 'proof-0-starter.png', fullPage: false });

  // Click play
  await page.locator('button.rounded-full').filter({ has: page.locator('svg') }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'proof-1-after-play.png', fullPage: false });

  // Hold on card (after ~4s)
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'proof-2-card-hold.png', fullPage: false });

  // Joint zoom (~3s later)
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'proof-3-joint-zoom.png', fullPage: false });

  // Wait enough to reach clean run (depends on fix count; use 45s buffer)
  await page.waitForTimeout(45000);
  await page.screenshot({ path: 'proof-4-clean-run.png', fullPage: false });

  await browser.close();
})();
