const puppeteer = require('/Users/ashish/Downloads/creative-edge-backend 2/node_modules/puppeteer-core');
const fs = require('fs');

async function runVerification() {
  console.log('🚀 Starting browser verification of Team Nartan Suite...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Verify Student Portal & Login with OTP 000000
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 440, height: 900, deviceScaleFactor: 2 });
  await page1.goto('http://localhost:3000/student', { waitUntil: 'networkidle0' });

  // Check login elements
  console.log('Testing Student Portal Login with Master OTP 000000...');
  await page1.click('#btnSendOtp');
  await new Promise(r => setTimeout(r, 600));

  // Enter master OTP 000000
  for (let i = 1; i <= 6; i++) {
    await page1.type(`#otp${i}`, '0');
  }
  await page1.click('#btnVerifyOtp');
  await new Promise(r => setTimeout(r, 1000));

  // Verify membership card is visible
  const cardName = await page1.$eval('#cardName', el => el.textContent);
  console.log(`✅ Student logged in! Membership pass name: ${cardName}`);
  await page1.screenshot({ path: '/tmp/nartan_student_pass.png' });

  // 2. Verify Studio Manager
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1.5 });
  await page2.goto('http://localhost:3000/manager', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const kpiStudents = await page2.$eval('#kpiActiveStudents', el => el.textContent);
  console.log(`✅ Studio Manager KPI Active Students: ${kpiStudents}`);
  await page2.screenshot({ path: '/tmp/nartan_manager_dashboard.png' });

  // 3. Verify Admission Form
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 800, height: 900, deviceScaleFactor: 1.5 });
  await page3.goto('http://localhost:3000/admission', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('Testing Admission Form Auto-Fill...');
  await page3.evaluate(() => fillDemoApplicant());
  await new Promise(r => setTimeout(r, 500));
  await page3.screenshot({ path: '/tmp/nartan_admission_form.png' });

  await browser.close();
  console.log('🎉 All 3 portals verified successfully via Chrome headless!');
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
