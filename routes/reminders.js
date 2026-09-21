// ================================================
// REMINDERS ROUTES — Direct Supabase REST API
// ================================================
const express = require('express');
const router  = express.Router();
const { sendWhatsApp, sendTelegram, dbSelect } = require('./students');

router.get('/trigger-daily', async (req, res) => {
  res.json({ success: true, message: 'Reminders processing in background...' });

  setImmediate(async () => {
    try {
      const today     = new Date().toISOString().split('T')[0];
      const tomorrow  = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const overdue     = await dbSelect('students', `fee_status=eq.pending&due_date=lte.${today}`);
      const dueTomorrow = await dbSelect('students', `fee_status=eq.pending&due_date=eq.${tomorrowStr}`);

      let sent = 0, results = [];

      for (const s of (overdue || [])) {
        try {
          const days = Math.floor((new Date(today) - new Date(s.due_date)) / (1000*60*60*24));
          await sendWhatsApp(s.phone,
            `⚠️ *Fee Reminder — Team Nartan Dance Studio*\n\nDear ${s.name},\n\nFee is *${days > 0 ? `OVERDUE by ${days} day(s)` : 'DUE TODAY'}*.\n\n💰 ₹${(s.fee_amount||0).toLocaleString('en-IN')}\n📅 Due: ${s.due_date}\n🎓 Batch: ${s.batch||'Your batch'}\n${s.payment_link?`\n💳 ${s.payment_link}\n`:''}\n📞 9999999999`
          );
          sent++; results.push({ name: s.name, status: days > 0 ? `overdue-${days}d` : 'due-today' });
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) { console.error(`[Reminder failed ${s.name}]`, e.message); }
      }

      for (const s of (dueTomorrow || [])) {
        try {
          await sendWhatsApp(s.phone,
            `🔔 *Fee Due Tomorrow — Team Nartan Dance Studio*\n\nDear ${s.name},\n\n₹${(s.fee_amount||0).toLocaleString('en-IN')} due *tomorrow* (${s.due_date}).\n${s.payment_link?`\n💳 ${s.payment_link}\n`:''}\n📞 9999999999`
          );
          sent++; results.push({ name: s.name, status: 'due-tomorrow' });
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) { console.error(`[Reminder failed ${s.name}]`, e.message); }
      }

      if (sent > 0) {
        const summary = `📊 *Daily Reminder Summary*\n📅 Date: ${today}\n📤 Sent: ${sent}\n\n` + results.map(r=>`• ${r.name} (${r.status})`).join('\n');
        await sendWhatsApp(process.env.ADMIN_PHONE, summary);
        await sendTelegram(summary);
      } else {
        await sendTelegram(`✅ *Daily Check (${today})*\nNo pending reminders today!`);
      }
      console.log(`[Reminders] Done. Sent: ${sent}`);
    } catch (err) { console.error('[Reminders Fatal]', err.message); }
  });
});

router.post('/send/:studentId', async (req, res) => {
  if (req.headers.password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const rows = await dbSelect('students', `id=eq.${req.params.studentId}`);
    const s = rows[0];
    if (!s) return res.status(404).json({ error: 'Student not found.' });
    await sendWhatsApp(s.phone,
      `🔔 *Fee Reminder — Team Nartan Dance Studio*\n\nDear ${s.name},\n\nFee of ₹${(s.fee_amount||0).toLocaleString('en-IN')} is due on *${s.due_date||'N/A'}*.\n${s.payment_link?`\n💳 ${s.payment_link}\n`:''}\n📞 9999999999 🎵`
    );
    res.json({ success: true, message: `Reminder sent to ${s.name}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
