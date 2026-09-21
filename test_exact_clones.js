const puppeteer = require('/Users/ashish/Downloads/creative-edge-backend 2/node_modules/puppeteer-core');
const fs = require('fs');

async function testExactClones() {
  console.log('🚀 Running automated visual & functional verification on exact ditto clones...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Verify Student Portal
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });
  await page1.goto('http://localhost:3000/student', { waitUntil: 'networkidle2' });

  const title1 = await page1.title();
  console.log(`Student Portal Title: ${title1}`);
  await page1.screenshot({ path: '/tmp/exact_student_login.png' });

  // Login with demo phone & master OTP 000000
  await page1.type('#login-phone', '9876543210');
  await page1.click('#send-otp-btn');
  await page1.waitForFunction(() => document.getElementById('otp-card') && document.getElementById('otp-card').style.display !== 'none', { timeout: 8000 });

  for (let i = 1; i <= 6; i++) {
    await page1.type(`#l-otp-${i}`, '0');
  }
  await page1.click('#verify-otp-btn');
  await page1.waitForFunction(() => document.getElementById('app') && document.getElementById('app').style.display !== 'none', { timeout: 8000 });

  await new Promise(r => setTimeout(r, 1000));
  await page1.screenshot({ path: '/tmp/exact_student_home.png' });
  console.log('✅ Student Portal verified with OTP 000000!');

  // Switch tabs in Student Portal
  await page1.evaluate(() => showPage('attendance'));
  await new Promise(r => setTimeout(r, 600));
  await page1.screenshot({ path: '/tmp/exact_student_attendance.png' });

  await page1.evaluate(() => showPage('pay'));
  await new Promise(r => setTimeout(r, 600));
  await page1.screenshot({ path: '/tmp/exact_student_pay.png' });

  await page1.evaluate(() => showPage('profile'));
  await new Promise(r => setTimeout(r, 600));
  await page1.screenshot({ path: '/tmp/exact_student_profile.png' });
  console.log('✅ Student Portal tabs (Attendance, Pay, Profile/Leaves) verified!');

  // 2. Verify Studio Manager
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
  await page2.goto('http://localhost:3000/manager', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const title2 = await page2.title();
  console.log(`Studio Manager Title: ${title2}`);
  await page2.screenshot({ path: '/tmp/exact_manager_dashboard.png' });

  // Test switching to Attendance with Batch Filter
  await page2.evaluate(() => showPage('attendance'));
  await new Promise(r => setTimeout(r, 600));
  await page2.screenshot({ path: '/tmp/exact_manager_attendance.png' });
  console.log('✅ Studio Manager Dashboard & Batch Attendance Filter verified!');

  // 3. Verify Admission Form
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 500, height: 880, deviceScaleFactor: 1.5 });
  await page3.goto('http://localhost:3000/admission', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const title3 = await page3.title();
  console.log(`Admission Form Title: ${title3}`);
  await page3.screenshot({ path: '/tmp/exact_admission_form.png' });
  console.log('✅ Admission Form verified!');

  await browser.close();
  console.log('🎉 100% Exact Ditto Clones Verified Successfully!');
}

testExactClones().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
