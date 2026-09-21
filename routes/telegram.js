// ================================================
// TELEGRAM BOT — Direct Supabase REST API
// ================================================
const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const { sendWhatsApp, dbSelect } = require('./students');

async function reply(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
  } catch (e) { console.error('[TG reply]', e.message); }
}

router.post('/webhook', async (req, res) => {
  res.json({ ok: true });
  try {
    const msg = req.body?.message;
    if (!msg) return;
    const chatId = msg.chat?.id;
    const text   = (msg.text || '').trim().toLowerCase();

    if (text === '/start' || text === '/help') {
      await reply(chatId,
        `🎵 *Team Nartan Dance Studio — Admin Bot*\n\n` +
        `/stats — Revenue summary\n/students — All students\n/pending — Pending fees\n/overdue — Overdue fees 🔴\n/paid — Recently paid\n/reminders — Send fee reminders\n/timings — Class schedule\n/fees — Fee structure`
      );
    } else if (text === '/stats') {
      const data = await dbSelect('students', '', 'fee_status,fee_amount,due_date');
      const today = new Date().toISOString().split('T')[0];
      const paid    = data.filter(s => s.fee_status === 'paid');
      const pending = data.filter(s => s.fee_status === 'pending');
      const overdue = pending.filter(s => s.due_date && s.due_date <= today);
      await reply(chatId,
        `📊 *Studio Stats*\n\n👥 Total: ${data.length}\n✅ Paid: ${paid.length}\n⏳ Pending: ${pending.length}\n🔴 Overdue: ${overdue.length}\n\n💰 Revenue: ₹${paid.reduce((s,x)=>s+(x.fee_amount||0),0).toLocaleString('en-IN')}\n⚠️ Outstanding: ₹${pending.reduce((s,x)=>s+(x.fee_amount||0),0).toLocaleString('en-IN')}`
      );
    } else if (text === '/overdue') {
      const today = new Date().toISOString().split('T')[0];
      const data  = await dbSelect('students', `fee_status=eq.pending&due_date=lte.${today}&order=due_date.asc`);
      if (!data.length) { await reply(chatId, '✅ No overdue fees!'); return; }
      const lines = data.map(s => { const d=Math.floor((new Date(today)-new Date(s.due_date))/(1000*60*60*24)); return `• ${s.name} | ₹${(s.fee_amount||0).toLocaleString('en-IN')} | ${d}d overdue | 📞${s.phone}`; });
      await reply(chatId, `🔴 *Overdue (${data.length})*\n\n${lines.join('\n')}`);
    } else if (text === '/pending') {
      const today = new Date().toISOString().split('T')[0];
      const data  = await dbSelect('students', `fee_status=eq.pending&order=due_date.asc`);
      if (!data.length) { await reply(chatId, '✅ No pending fees!'); return; }
      const lines = data.map(s => `• ${s.name} | ₹${(s.fee_amount||0).toLocaleString('en-IN')} | Due: ${s.due_date||'N/A'}${s.due_date&&s.due_date<=today?' 🔴':''}`);
      await reply(chatId, `⏳ *Pending (${data.length})*\n\n${lines.join('\n')}`);
    } else if (text === '/paid') {
      const data = await dbSelect('students', `fee_status=eq.paid&order=created_at.desc&limit=20`);
      if (!data.length) { await reply(chatId, 'No paid students yet.'); return; }
      const lines = data.map(s => `• ${s.name} | ₹${(s.fee_amount||0).toLocaleString('en-IN')} | ${s.payment_method==='cash'?'💵 Cash':'💳 Online'}`);
      await reply(chatId, `✅ *Recently Paid (last 20)*\n\n${lines.join('\n')}`);
    } else if (text === '/students') {
      const data = await dbSelect('students', `order=created_at.desc&limit=25`);
      if (!data.length) { await reply(chatId, 'No students yet.'); return; }
      const lines = data.map(s => `• ${s.name} | ${s.batch||'—'} | ${s.fee_status==='paid'?'✅':'⏳'} | 📞${s.phone}`);
      await reply(chatId, `👥 *All Students (last 25)*\n\n${lines.join('\n')}`);
    } else if (text === '/reminders') {
      await reply(chatId, '⏳ Sending reminders...');
      const today = new Date().toISOString().split('T')[0];
      const data  = await dbSelect('students', `fee_status=eq.pending&due_date=lte.${today}`);
      if (!data.length) { await reply(chatId, '✅ No overdue reminders today!'); return; }
      let sent = 0;
      for (const s of data) {
        try {
          const days = Math.floor((new Date(today)-new Date(s.due_date))/(1000*60*60*24));
          await sendWhatsApp(s.phone, `⚠️ *Fee Reminder*\n\nDear ${s.name},\nFee of ₹${(s.fee_amount||0).toLocaleString('en-IN')} is ${days>0?`overdue by ${days} day(s)`:'due today'}.\n\n📞 9999999999`);
          sent++; await new Promise(r => setTimeout(r, 1500));
        } catch(e) {}
      }
      await reply(chatId, `✅ Sent ${sent} reminder(s)!`);
    } else if (text === '/timings') {
      await reply(chatId, `⏰ *Class Timings (Mon–Fri)*\n\n4:00 PM → Kids (2.5–6 yrs)\n5:00 PM → Kids (3–8 yrs)\n5:00–6:00 PM → Zumba\n6:00–7:30 PM → Hip-Hop Advance\n6:00–8:00 PM → Basic Hip-Hop`);
    } else if (text === '/fees') {
      await reply(chatId, `💰 *Fee Structure*\n\n*Kids (3–8 yrs):*\n1M: ₹1,200 | 3M: ₹3,000\n6M: ₹5,500 | 12M: ₹9,500\n\n*Adults/Advance:*\n1M: ₹1,500 | 3M: ₹3,500\n6M: ₹6,500 | 12M: ₹10,500`);
    } else {
      await reply(chatId, `Type /help to see all commands. 🎵`);
    }
  } catch (err) { console.error('[Telegram webhook]', err.message); }
});

router.get('/set-webhook', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ error: 'Pass ?url=https://your-app.onrender.com' });
  try {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${url}/api/telegram/webhook` })
    });
    res.json(await r.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
