import puppeteer from 'puppeteer';

(async () => {
  console.log('🏀 Testing PHASE 10 - Settings & Automation...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1500, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // STEP 1: Go to Settings page
    console.log('📄 STEP 1: Loading Settings page...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   ✅ Settings page loaded');
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/phase10_settings_notifications.png', fullPage: true });
    
    // Check for Settings page elements
    const settingsFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Settings'),
        hasNotificationsTab: text.includes('Notifications'),
        hasAutomationTab: text.includes('Automation'),
        hasDataPrivacyTab: text.includes('Data & Privacy'),
        hasEmailNotifications: text.includes('Email Notifications'),
        hasPushNotifications: text.includes('Push Notifications'),
        hasWeeklyReports: text.includes('Weekly Performance Reports'),
        hasMonthlyReports: text.includes('Monthly Comprehensive Analysis'),
        hasMilestoneNotifications: text.includes('Milestone'),
        hasCoachingTips: text.includes('Coaching Tips'),
        hasMotivationalMessages: text.includes('Motivational Messages'),
        hasSaveButton: text.includes('Save Changes')
      };
    });
    
    console.log('\n📊 Settings Page - Notifications Tab:');
    console.log('   Title: ' + (settingsFeatures.hasTitle ? '✅' : '❌'));
    console.log('   Notifications Tab: ' + (settingsFeatures.hasNotificationsTab ? '✅' : '❌'));
    console.log('   Automation Tab: ' + (settingsFeatures.hasAutomationTab ? '✅' : '❌'));
    console.log('   Data & Privacy Tab: ' + (settingsFeatures.hasDataPrivacyTab ? '✅' : '❌'));
    console.log('   Email Notifications: ' + (settingsFeatures.hasEmailNotifications ? '✅' : '❌'));
    console.log('   Push Notifications: ' + (settingsFeatures.hasPushNotifications ? '✅' : '❌'));
    console.log('   Weekly Reports: ' + (settingsFeatures.hasWeeklyReports ? '✅' : '❌'));
    console.log('   Monthly Reports: ' + (settingsFeatures.hasMonthlyReports ? '✅' : '❌'));
    console.log('   Milestone Notifications: ' + (settingsFeatures.hasMilestoneNotifications ? '✅' : '❌'));
    console.log('   Coaching Tips: ' + (settingsFeatures.hasCoachingTips ? '✅' : '❌'));
    console.log('   Motivational Messages: ' + (settingsFeatures.hasMotivationalMessages ? '✅' : '❌'));
    console.log('   Save Button: ' + (settingsFeatures.hasSaveButton ? '✅' : '❌'));
    
    // STEP 2: Click Automation tab
    console.log('\n⚙️ STEP 2: Testing Automation tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Automation'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: '/tmp/phase10_settings_automation.png', fullPage: true });
    
    const automationFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasDailyTasks: text.includes('Daily Automated Tasks'),
        hasWeeklyTasks: text.includes('Weekly Automated Tasks'),
        hasMonthlyTasks: text.includes('Monthly Automated Tasks'),
        hasAnalyticsRefresh: text.includes('Analytics Refresh'),
        hasDataBackup: text.includes('Data Backup'),
        hasModelUpdates: text.includes('Model Updates'),
        hasWeeklyReportSchedule: text.includes('Weekly Performance Reports'),
        hasCoachAlerts: text.includes('Coach Alerts'),
        hasAutomationStatus: text.includes('Automation Status')
      };
    });
    
    console.log('   Daily Automated Tasks: ' + (automationFeatures.hasDailyTasks ? '✅' : '❌'));
    console.log('   Weekly Automated Tasks: ' + (automationFeatures.hasWeeklyTasks ? '✅' : '❌'));
    console.log('   Monthly Automated Tasks: ' + (automationFeatures.hasMonthlyTasks ? '✅' : '❌'));
    console.log('   Analytics Refresh: ' + (automationFeatures.hasAnalyticsRefresh ? '✅' : '❌'));
    console.log('   Data Backup: ' + (automationFeatures.hasDataBackup ? '✅' : '❌'));
    console.log('   Model Updates: ' + (automationFeatures.hasModelUpdates ? '✅' : '❌'));
    console.log('   Weekly Report Schedule: ' + (automationFeatures.hasWeeklyReportSchedule ? '✅' : '❌'));
    console.log('   Coach Alerts: ' + (automationFeatures.hasCoachAlerts ? '✅' : '❌'));
    console.log('   Automation Status: ' + (automationFeatures.hasAutomationStatus ? '✅' : '❌'));
    
    // STEP 3: Click Data & Privacy tab
    console.log('\n🔒 STEP 3: Testing Data & Privacy tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Data & Privacy'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: '/tmp/phase10_settings_privacy.png', fullPage: true });
    
    const privacyFeatures = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasDataManagement: text.includes('Data Management'),
        hasExportData: text.includes('Export All Data'),
        hasClearHistory: text.includes('Clear Analysis History'),
        hasResetSettings: text.includes('Reset All Settings'),
        hasPrivacy: text.includes('Privacy'),
        hasStorageUsage: text.includes('Storage Usage')
      };
    });
    
    console.log('   Data Management: ' + (privacyFeatures.hasDataManagement ? '✅' : '❌'));
    console.log('   Export Data: ' + (privacyFeatures.hasExportData ? '✅' : '❌'));
    console.log('   Clear History: ' + (privacyFeatures.hasClearHistory ? '✅' : '❌'));
    console.log('   Reset Settings: ' + (privacyFeatures.hasResetSettings ? '✅' : '❌'));
    console.log('   Privacy Section: ' + (privacyFeatures.hasPrivacy ? '✅' : '❌'));
    console.log('   Storage Usage: ' + (privacyFeatures.hasStorageUsage ? '✅' : '❌'));
    
    // STEP 4: Check header navigation
    console.log('\n🧭 STEP 4: Checking header navigation...');
    const headerFeatures = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return { hasSettingsLink: false };
      
      const links = nav.querySelectorAll('a');
      let hasSettingsLink = false;
      
      links.forEach(link => {
        if (link.textContent?.includes('SETTINGS')) {
          hasSettingsLink = true;
        }
      });
      
      return { hasSettingsLink };
    });
    
    console.log('   Settings Link in Header: ' + (headerFeatures.hasSettingsLink ? '✅' : '❌'));
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ PHASE 10 TESTING COMPLETE');
    console.log('='.repeat(50));
    console.log('\nScreenshots saved to /tmp/phase10_*.png');
    console.log('\n🔍 Browser is open for manual verification...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/phase10_error.png', fullPage: true });
  }
  
  // Keep browser open
  await new Promise(() => {});
})();

