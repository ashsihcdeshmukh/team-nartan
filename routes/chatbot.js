// ================================================
// CHATBOT ROUTE — Fixed with detailed error logging
// ================================================
const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');

const SYSTEM = `You are a friendly assistant for Team Nartan Dance Studio in Durg, Chhattisgarh, India.

STUDIO INFO:
- Phone: 7869240161
- Address: Behind Bharat Petrol Pump, Station Road, Durg
- Google Maps: https://maps.app.goo.gl/Q4sSSqC5xWcT5LT68
- Instagram: https://www.instagram.com/creative_edge_dance_studio
- Admission Form: https://precious-sherbet-723ee4.netlify.app/
- Online Payment: https://razorpay.me/@creativeedgedancestudio

CLASS TIMINGS (Monday to Friday):
- 4:00 PM → Kids (2.5–6 years)
- 5:00 PM → Kids (3–8 years)
- 5:00–6:00 PM → Zumba
- 6:00–7:30 PM → Hip-Hop Advance
- 6:00–8:00 PM → Basic Hip-Hop

FEES:
Kids (3–8 yrs): Rs.1,200/1M | Rs.3,000/3M | Rs.5,500/6M | Rs.9,500/12M
Adults/Advance: Rs.1,500/1M | Rs.3,500/3M | Rs.6,500/6M | Rs.10,500/12M

RULES:
- Warm, encouraging tone. Max 3-4 lines per reply.
- For admission questions: share the form link.
- For location questions: share Google Maps link.
- For payment questions: share razorpay.me/@creativeedgedancestudio
- If unsure about anything: say "Please call 7869240161"
- Respond in Hindi or English based on user language.`;

// GET /api/chatbot/test  — shows if API key is configured
router.get('/test', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  if (!key || key.includes('PASTE') || key.length < 20) {
    return res.json({
      status: 'error',
      problem: 'ANTHROPIC_API_KEY not set or still placeholder',
      fix: 'Go to Render → Environment → set ANTHROPIC_API_KEY to your sk-ant-... key'
    });
  }
  res.json({
    status: 'ok',
    key_set: true,
    key_preview: key.substring(0, 12) + '...'
  });
});

// POST /api/chatbot/ask
router.post('/ask', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message required.' });

  const apiKey = process.env.ANTHROPIC_API_KEY || '';

  // Detect missing/placeholder key — return helpful error instead of silent fail
  if (!apiKey || apiKey.includes('PASTE') || apiKey.length < 20) {
    console.error('[Chatbot] ANTHROPIC_API_KEY is not set or is placeholder');
    return res.json({
      reply: 'AI assistant is not configured yet. Please call us at 7869240161! 📞',
      debug: 'API key missing'
    });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system:     SYSTEM,
        messages:   [...history.slice(-6), { role: 'user', content: message }]
      })
    });

    const data = await r.json();

    // Log full error so we can see it in Render logs
    if (data.error) {
      console.error('[Chatbot API Error]', JSON.stringify(data.error));
      return res.json({
        reply: `AI error: ${data.error.message || 'Unknown'}. Please call 7869240161! 📞`,
        debug: data.error
      });
    }

    if (!data.content || !data.content[0]) {
      console.error('[Chatbot] Unexpected response:', JSON.stringify(data));
      return res.json({ reply: 'Please call us at 7869240161! 📞' });
    }

    res.json({ reply: data.content[0].text });

  } catch (err) {
    console.error('[Chatbot Network Error]', err.message);
    res.json({ reply: 'Connection error. Please call 7869240161! 📞' });
  }
});

module.exports = router;
