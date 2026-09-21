// ================================================
// STUDENTS ROUTES — Direct Supabase REST API
// ================================================
const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const crypto  = require('crypto');

// ── Direct Supabase REST helpers ─────────────────
function sbHeaders(extra = {}) {
  return {
    'Content-Type':  'application/json',
    'apikey':        process.env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    ...extra
  };
}

async function dbSelect(table, filters = '', columns = '*') {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?select=${columns}${filters ? '&' + filters : ''}`;
  const r   = await fetch(url, { headers: sbHeaders() });
  const text = await r.text();
  let data = [];
  try { if (text) data = JSON.parse(text); } catch(e) {}
  if (!r.ok) { throw new Error(data.message || `DB error ${r.status}`); }
  return data;
}

async function dbInsert(table, data) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}`;
  const r   = await fetch(url, {
    method:  'POST',
    headers: sbHeaders({ 'Prefer': 'return=representation' }),
    body:    JSON.stringify(data)
  });
  const text = await r.text();
  let json = [];
  try { if (text) json = JSON.parse(text); } catch(e) {}
  if (!r.ok) {
    console.error('[DB Insert Error]', text);
    throw new Error(json.message || json.details || json.hint || `DB insert failed (${r.status})`);
  }
  return json[0];
}

async function dbUpdate(table, id, data) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const r   = await fetch(url, {
    method:  'PATCH',
    headers: sbHeaders({ 'Prefer': 'return=representation' }),
    body:    JSON.stringify(data)
  });
  const text = await r.text();
  let json = [];
  try { if (text) json = JSON.parse(text); } catch(e) {}
  if (!r.ok) { throw new Error(json.message || `DB update failed`); }
  return json;
}

async function dbDelete(table, id) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const r   = await fetch(url, { method: 'DELETE', headers: sbHeaders() });
  const text = await r.text();
  let data = {};
  try { if (text) data = JSON.parse(text); } catch(e) {}
  if (!r.ok) { throw new Error(data.message || `DB delete failed`); }
  return true;
}

// ── WhatsApp helper ──────────────────────────────
async function sendWhatsApp(phone, message) {
  try {
    const p  = phone.toString().replace(/\D/g, '');
    const fp = p.startsWith('91') ? p : `91${p}`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${fp}&text=${encodeURIComponent(message)}&apikey=${process.env.CALLMEBOT_API_KEY}`;
    const r   = await fetch(url);
    const txt = await r.text();
    console.log(`[WA → ${fp}] status=${r.status} resp=${txt.substring(0, 80)}`);
    return { ok: r.ok, response: txt };
  } catch (e) {
    console.error('[WA Error]', e.message);
    return { ok: false, error: e.message };
  }
}

// ── Telegram helper ──────────────────────────────
async function sendTelegram(text) {
  try {
    const r = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:    process.env.TELEGRAM_ADMIN_CHAT_ID,
          text,
          parse_mode: 'Markdown'
        })
      }
    );
    const responseText = await r.text();
    let d = {};
    try { if (responseText) d = JSON.parse(responseText); } catch(e) {}
    if (!r.ok || !d.ok) console.error('[Telegram Error]', responseText);
    return d;
  } catch (e) {
    console.error('[Telegram Error]', e.message);
    return { ok: false };
  }
}

const FEES = {
  kids:  { '1M': 1200, '3M': 3000, '6M': 5500,  '12M': 9500  },
  adult: { '1M': 1500, '3M': 3500, '6M': 6500,  '12M': 10500 }
};

function getDueDate(plan) {
  const months = { '1M': 1, '3M': 3, '6M': 6, '12M': 12 };
  const d = new Date();
  d.setMonth(d.getMonth() + (months[plan] || 1));
  return d.toISOString().split('T')[0];
}

function normalizeStudent(s){
  if(!s) return null;
  s.dance_style = s.dance_style || s.category || "Dance";
  s.monthly_fee = Number(s.monthly_fee || s.fee_amount || 0);
  s.next_due_date = s.next_due_date || s.due_date || "";
  s.enrolled_date = s.enrolled_date || s.admission_date || "";
  s.last_paid_date = s.last_paid_date || s.admission_date || "";
  s.status = s.status || (s.fee_status === "Paid" ? "Active" : "Active");
  s.batch = s.batch || "Team Nartan";
  return s;
}

const loginOtpStore = new Map();

function generateLoginOTP(){
  return crypto.randomInt(1000, 10000).toString();
}

async function findStudentByPhone(phone){
  const cleaned = String(phone || "").replace(/\D/g, "");
  const last10 = cleaned.slice(-10);
  const with91 = "91" + last10;
  const formats = [last10, with91, "+" + with91, cleaned];

  for(const fmt of formats){
    const rows = await dbSelect('students', `phone=eq.${fmt}`);
    if(rows.length > 0) return normalizeStudent(rows[0]);
  }

  const all = await dbSelect('students', 'order=created_at.desc');
  const found = all.find(s => String(s.phone).replace(/\D/g, '').slice(-10) === last10) || null;
  return normalizeStudent(found);
}

function otpStoreKey(phone){
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

// ════════════════════════════════════════════════
// GET /api/students/test-db
// ════════════════════════════════════════════════
router.get('/test-db', async (req, res) => {
  try {
    const rows = await dbSelect('students', 'limit=1');
    res.json({ success: true, message: 'DB connection works!', rows: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════
// GET /api/students/test-whatsapp
// Sends a test WA to admin phone to verify CallMeBot works
// ════════════════════════════════════════════════
router.get('/test-whatsapp', async (req, res) => {
  const result = await sendWhatsApp(
    process.env.ADMIN_PHONE,
    `✅ WhatsApp test from Team Nartan Dance Studio backend! Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
  );
  res.json({
    message: 'Test WhatsApp sent to admin phone',
    admin_phone: process.env.ADMIN_PHONE,
    callmebot_key: process.env.CALLMEBOT_API_KEY ? process.env.CALLMEBOT_API_KEY.substring(0, 4) + '...' : 'NOT SET',
    result
  });
});

// ════════════════════════════════════════════════
// POST /api/students/admit
// payment_method: 'cash' | 'online' | 'later'
// ════════════════════════════════════════════════
router.post('/admit', async (req, res) => {
  try {
    console.log('[ADMIT] Body:', JSON.stringify(req.body));

    const {
      name, phone, parent_name, age,
      category, batch, fee_plan, notes,
      payment_method   // NEW: 'cash', 'online', or 'later'
    } = req.body;

    if (!name || !phone || !fee_plan)
      return res.status(400).json({ error: 'name, phone, and fee_plan are required.' });

    const cleanPhone = phone.toString().replace(/\D/g, '');
    if (cleanPhone.length < 10)
      return res.status(400).json({ error: 'Invalid phone number. Must be 10 digits.' });

    const cat        = (category || 'kids').toLowerCase();
    const fee_amount = FEES[cat]?.[fee_plan] || 0;
    const due_date   = getDueDate(fee_plan);
    const pmethod    = payment_method || 'pending';

    // If paid by cash right now, mark as paid immediately
    const fee_status = pmethod === 'cash' ? 'paid' : 'pending';

    console.log(`[ADMIT] Saving: ${name} | ${cleanPhone} | ${fee_plan} | payment=${pmethod}`);

    const student = await dbInsert('students', {
      name,
      phone:          cleanPhone,
      parent_name:    parent_name || null,
      age:            parseInt(age) || null,
      category:       cat,
      batch:          batch || '',
      fee_plan,
      fee_amount,
      fee_status,
      payment_method: pmethod,
      due_date,
      notes:          notes || ''
    });

    console.log('[ADMIT] Saved. ID:', student?.id, '| fee_status:', fee_status);

    // ── Build WhatsApp message based on payment method ──
    let waMsg;
    if (pmethod === 'cash') {
      waMsg =
        `🎵 *Welcome to Team Nartan Dance Studio!*\n\n` +
        `Hello ${name}! 🙏\n\n` +
        `Your admission is *confirmed* and payment received! ✅\n\n` +
        `📋 *Details:*\n` +
        `• Batch: ${batch || 'To be assigned'}\n` +
        `• Plan: ${fee_plan}\n` +
        `• Amount: ₹${fee_amount.toLocaleString('en-IN')} (Cash Paid)\n` +
        `• Next Due: ${due_date}\n\n` +
        `📍 Behind Bharat Petrol Pump, Station Road, Durg\n` +
        `📞 9999999999\n\n` +
        `See you on the dance floor! 💃🕺`;
    } else if (pmethod === 'online') {
      waMsg =
        `🎵 *Welcome to Team Nartan Dance Studio!*\n\n` +
        `Hello ${name}! 🙏\n\n` +
        `Your admission is *confirmed*!\n\n` +
        `📋 *Details:*\n` +
        `• Batch: ${batch || 'To be assigned'}\n` +
        `• Plan: ${fee_plan}\n` +
        `• Amount: ₹${fee_amount.toLocaleString('en-IN')}\n\n` +
        `💳 *Pay online here:*\n` +
        `👉 https://razorpay.me/@creativeedgedancestudio\n\n` +
        `📍 Behind Bharat Petrol Pump, Station Road, Durg\n` +
        `📞 9999999999\n\n` +
        `See you on the dance floor! 💃🕺`;
    } else {
      waMsg =
        `🎵 *Welcome to Team Nartan Dance Studio!*\n\n` +
        `Hello ${name}! 🙏\n\n` +
        `Your admission is *confirmed*!\n\n` +
        `📋 *Details:*\n` +
        `• Batch: ${batch || 'To be assigned'}\n` +
        `• Plan: ${fee_plan}\n` +
        `• Fee: ₹${fee_amount.toLocaleString('en-IN')}\n` +
        `• Due Date: ${due_date}\n\n` +
        `💳 Pay at studio or online:\n` +
        `👉 https://razorpay.me/@creativeedgedancestudio\n\n` +
        `📍 Behind Bharat Petrol Pump, Station Road, Durg\n` +
        `📞 9999999999\n\n` +
        `See you on the dance floor! 💃🕺`;
    }

    // Send to student
    const waResult = await sendWhatsApp(cleanPhone, waMsg);
    console.log('[ADMIT] Student WA result:', JSON.stringify(waResult));

    // Send to admin
    const adminMsg =
      `🔔 *New Admission!*\n\n` +
      `Name: ${name}\n` +
      `Phone: ${cleanPhone}\n` +
      `Age: ${age || 'N/A'}\n` +
      `Batch: ${batch || 'TBD'}\n` +
      `Plan: ${fee_plan} — ₹${fee_amount.toLocaleString('en-IN')}\n` +
      `Payment: ${pmethod.toUpperCase()}\n` +
      `Status: ${fee_status.toUpperCase()}\n` +
      `Due: ${due_date}`;

    await sendWhatsApp(process.env.ADMIN_PHONE, adminMsg);
    await sendTelegram(adminMsg.replace(/\*/g, ''));

    res.json({
      success:    true,
      student_id: student?.id,
      fee_amount,
      due_date,
      fee_status,
      payment_method: pmethod
    });

  } catch (err) {
    console.error('[ADMIT ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// GET /api/students/all
// ════════════════════════════════════════════════
router.get('/all', async (req, res) => {
  if (req.headers.password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const data  = await dbSelect('students', 'order=created_at.desc');
    const today = new Date().toISOString().split('T')[0];
    const paid    = data.filter(s => s.fee_status === 'paid');
    const pending = data.filter(s => s.fee_status === 'pending');
    const overdue = pending.filter(s => s.due_date && s.due_date <= today);

    res.json({
      stats: {
        total:          data.length,
        paid:           paid.length,
        pending:        pending.length,
        overdue:        overdue.length,
        totalRevenue:   paid.reduce((s, x) => s + (x.fee_amount || 0), 0),
        pendingRevenue: pending.reduce((s, x) => s + (x.fee_amount || 0), 0)
      },
      students: data
    });
  } catch (err) {
    console.error('[ALL ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// PATCH /api/students/:id/mark-paid
// ════════════════════════════════════════════════
router.patch('/:id/mark-paid', async (req, res) => {
  if (req.headers.password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const rows    = await dbSelect('students', `id=eq.${req.params.id}`);
    const student = rows[0];
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const months = { '1M': 1, '3M': 3, '6M': 6, '12M': 12 };
    const d = new Date();
    d.setMonth(d.getMonth() + (months[student.fee_plan] || 1));
    const newDue = d.toISOString().split('T')[0];

    await dbUpdate('students', req.params.id, {
      fee_status:     'paid',
      payment_id:     req.body.payment_id || 'manual',
      payment_method: req.body.payment_method || 'online',
      due_date:       newDue
    });

    await sendWhatsApp(student.phone,
      `✅ *Payment Confirmed!*\n\nDear ${student.name},\n\nFee of ₹${(student.fee_amount || 0).toLocaleString('en-IN')} received!\n📅 Next due: ${newDue}\n\nThank you! Keep dancing! 🎵💃`
    );

    res.json({ success: true, new_due_date: newDue });
  } catch (err) {
    console.error('[MARK-PAID ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// DELETE /api/students/:id
// ════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  if (req.headers.password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized.' });

  try {
    await dbDelete('students', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// POST /api/students/send-login-otp
// ════════════════════════════════════════════════
router.post('/send-login-otp', async (req, res) => {
  try {
    const { phone, method = 'sms' } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });
    
    const cleanPhone = phone.toString().replace(/\D/g, '');
    if (cleanPhone.length < 10) return res.status(400).json({ error: 'Invalid phone number.' });
    
    const last10 = cleanPhone.slice(-10);
    const with91 = '91' + last10;
    const formats = [last10, with91, '+' + with91, cleanPhone];
    let student = null;
    
    for (const fmt of formats) {
      const rows = await dbSelect('students', `phone=eq.${fmt}`);
      if (rows.length > 0) { student = rows[0]; break; }
    }
    
    if (!student) {
      const all = await dbSelect('students', 'order=created_at.desc');
      student = all.find(s => String(s.phone).replace(/\D/g, '').slice(-10) === last10) || null;
    }
    
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    
    // Check resend cooldown
    const storeKey = otpStoreKey(last10);
    const existing = loginOtpStore.get(storeKey);
    if (existing && Date.now() - existing.lastSentAt < 30000) {
      return res.status(429).json({ error: 'Please wait before requesting another OTP.' });
    }
    
    // Generate fallback local OTP
    const generatedOtp = generateLoginOTP();
    const apiKey = process.env.TWOFACTOR_API_KEY || '1925099b-9969-11f1-9cb1-0200cd936042';
    let twoFactorSession = '';
    let deliveryMessage = 'OTP sent to your phone.';

    if (method === 'sms') {
      let sentVia2Factor = false;
      
      // 1. Try Voice Call OTP (10 digits)
      try {
        const voiceUrl = `https://2factor.in/API/V1/${apiKey}/VOICE/${last10}/AUTOGEN`;
        const rVoice = await fetch(voiceUrl);
        const voiceText = await rVoice.text();
        let voiceData = {};
        try { voiceData = JSON.parse(voiceText); } catch(e){}
        if (voiceData.Status === 'Success' || voiceData.Status === 'success') {
          twoFactorSession = voiceData.Details || voiceData.details || '';
          sentVia2Factor = true;
          deliveryMessage = 'You will receive a call with your OTP on your mobile number.';
        }
      } catch(err) {
        console.warn('2Factor Voice attempt failed:', err.message);
      }

      // 2. If voice didn't succeed, try SMS
      if (!sentVia2Factor) {
        try {
          const smsUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${last10}/AUTOGEN3/OTP`;
          const rSms = await fetch(smsUrl);
          const smsText = await rSms.text();
          let smsData = {};
          try { smsData = JSON.parse(smsText); } catch(e){}
          if (smsData.Status === 'Success' || smsData.Status === 'success') {
            twoFactorSession = smsData.Details || smsData.details || '';
            sentVia2Factor = true;
            deliveryMessage = 'OTP sent via SMS to your mobile number.';
          }
        } catch(err) {
          console.warn('2Factor SMS attempt failed:', err.message);
        }
      }

      // 3. Telegram notification as backup
      try {
        const tgMsg = `🔐 STUDENT LOGIN OTP REQUEST\n\nStudent: ${student.name}\nPhone: ${last10}\nLocal OTP: ${generatedOtp}\nMode: SMS/Voice\n2Factor Session: ${twoFactorSession || 'Local'}`;
        sendTelegram(tgMsg).catch(()=>{});
      } catch(e){}

    } else {
      // Studio OTP mode
      const maskedPhone = '****' + last10.slice(-4);
      const msg = `🏢 STUDIO LOGIN OTP\n\nStudent: ${student.name}\nPhone: ${maskedPhone}\nOTP: ${generatedOtp}\nValid for: 10 minutes\n\nShare this OTP with the student after verifying identity.`;
      await sendTelegram(msg);
      deliveryMessage = 'OTP sent to studio staff. Please ask studio staff for your OTP.';
    }

    loginOtpStore.set(storeKey, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      method,
      studentName: student.name,
      lastSentAt: Date.now(),
      twoFactorSession: twoFactorSession
    });
    
    res.json({
      success: true,
      message: deliveryMessage,
      student: { name: student.name, phone: last10 }
    });
    
  } catch (err) {
    console.error('[send-login-otp]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// POST /api/students/verify-login-otp
// ════════════════════════════════════════════════
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required.' });
    
    const cleanPhone = phone.toString().replace(/\D/g, '');
    const last10 = cleanPhone.slice(-10);
    const storeKey = otpStoreKey(last10);
    const record = loginOtpStore.get(storeKey);
    
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this phone. Please request a new one.' });
    }
    
    if (Date.now() > record.expiresAt) {
      loginOtpStore.delete(storeKey);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      loginOtpStore.delete(storeKey);
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }
    
    const enteredOtp = otp.toString().trim();
    let verified = false;
    
    // Check 2Factor session if available
    if (record.twoFactorSession) {
      try {
        const apiKey = process.env.TWOFACTOR_API_KEY || '1925099b-9969-11f1-9cb1-0200cd936042';
        const vUrl = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY3/${record.twoFactorSession}/${enteredOtp}`;
        const vr = await fetch(vUrl);
        const vText = await vr.text();
        let vData = {};
        try { vData = JSON.parse(vText); } catch(e){}
        if (vData.Status === 'Success' || vData.Status === 'success' || vData.Details === 'OTP Matched') {
          verified = true;
        } else {
          // Fallback to older endpoint check
          const vUrlOld = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${record.twoFactorSession}/${enteredOtp}`;
          const vrOld = await fetch(vUrlOld);
          const vTextOld = await vrOld.text();
          let vDataOld = {};
          try { vDataOld = JSON.parse(vTextOld); } catch(e){}
          if (vDataOld.Status === 'Success' || vDataOld.Status === 'success' || vDataOld.Details === 'OTP Matched') {
            verified = true;
          }
        }
      } catch (err) {
        console.warn('[2Factor Verify Error]', err.message);
      }
    }
    
    // Also allow local OTP match or Universal Demo Master OTP (000000)
    if (!verified && (enteredOtp === '000000' || (record.otp && record.otp === enteredOtp))) {
      verified = true;
    }
    
    if (!verified) {
      loginOtpStore.set(storeKey, record);
      return res.status(400).json({ error: 'Incorrect OTP. Please check and try again.' });
    }
    
    // Clean up used OTP
    loginOtpStore.delete(storeKey);
    
    // Fetch full student record
    const with91 = '91' + last10;
    const formats = [last10, with91, '+' + with91, cleanPhone];
    let student = null;
    for (const fmt of formats) {
      const rows = await dbSelect('students', `phone=eq.${fmt}`);
      if (rows.length > 0) { student = rows[0]; break; }
    }
    if (!student) {
      const all = await dbSelect('students', 'order=created_at.desc');
      student = all.find(s => String(s.phone).replace(/\D/g, '').slice(-10) === last10) || null;
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      student: student
    });
    
  } catch (err) {
    console.error('[verify-login-otp]', err.message);
    res.status(500).json({ error: err.message });
  }
});


module.exports = { router, sendWhatsApp, sendTelegram, dbSelect, dbUpdate, dbInsert };
