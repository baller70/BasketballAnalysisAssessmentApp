const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/settings');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'settings_light.png' });
  
  await page.goto('http://localhost:3000/badges');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'badges_light.png' });
  
  await page.goto('http://localhost:3000/elite-shooters');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'elite_shooters_light.png' });
  
  await browser.close();
  console.log("Screenshots captured.");
})();
