require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const store = require('./data/store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory OTP storage for dynamic OTPs
const otpStore = new Map(); // phone -> { otp, expiresAt }
const DEFAULT_OTP = "000000";

// ── Static Portals ──────────────────────────────
app.use('/shared', express.static(path.join(__dirname, 'public/shared')));
app.use('/student', express.static(path.join(__dirname, 'public/student')));
app.use('/admission', express.static(path.join(__dirname, 'public/admission')));
app.use('/manager', express.static(path.join(__dirname, 'public/manager')));
app.use('/', express.static(path.join(__dirname, 'public')));

// ── API ROUTES ──────────────────────────────────

// 1. Studio Info
app.get('/api/studio-info', (req, res) => {
  const db = store.readDb();
  res.json({
    status: 'ok',
    studio: db.studioInfo,
    defaultOtp: DEFAULT_OTP,
    batches: db.batches || []
  });
});

// 2. Auth: Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const student = store.findStudentByPhone(cleanPhone);

    if (!student) {
      return res.status(404).json({
        error: 'No student found with this mobile number. Please check or register via the Admission Form.'
      });
    }

    // Dynamic 6-digit OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(cleanPhone, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    console.log(`[AUTH] OTP requested for ${student.name} (${cleanPhone}): Dynamic OTP=${generatedOtp}, Default Master OTP=${DEFAULT_OTP}`);

    return res.json({
      success: true,
      message: `OTP sent successfully. Demo master OTP is ${DEFAULT_OTP}`,
      defaultOtp: DEFAULT_OTP,
      generatedOtp: generatedOtp,
      student: {
        id: student.id,
        name: student.name,
        phone: cleanPhone
      }
    });
  } catch (err) {
    console.error('[send-otp]', err);
    res.status(500).json({ error: 'Server error generating OTP' });
  }
});

// 3. Auth: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const student = store.findStudentByPhone(cleanPhone);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const enteredOtp = String(otp).trim();
    const stored = otpStore.get(cleanPhone);

    // Universal default master OTP: 000000 or dynamically generated OTP
    const isMasterOtp = enteredOtp === DEFAULT_OTP;
    const isGeneratedOtp = stored && stored.otp === enteredOtp && Date.now() < stored.expiresAt;

    if (!isMasterOtp && !isGeneratedOtp) {
      return res.status(400).json({
        error: 'Invalid OTP. For testing, you can use the default OTP: 000000'
      });
    }

    // Clear dynamic OTP once verified
    if (stored) otpStore.delete(cleanPhone);

    return res.json({
      success: true,
      message: 'Authentication successful',
      token: `nartan_token_${Date.now()}`,
      student: student
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    res.status(500).json({ error: 'Server error verifying OTP' });
  }
});

// 4. Student Routes
app.get('/api/students', (req, res) => {
  res.json({ success: true, students: store.getStudents() });
});

app.get('/api/students/:id', (req, res) => {
  const student = store.findStudentById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json({ success: true, student });
});

app.post('/api/students', (req, res) => {
  try {
    const newStudent = store.addStudent(req.body);
    res.status(201).json({ success: true, student: newStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', (req, res) => {
  try {
    const updated = store.updateStudent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true, student: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Batches Route
app.get('/api/batches', (req, res) => {
  const db = store.readDb();
  res.json({ success: true, batches: db.batches || [] });
});

// 6. Attendance Routes
app.get('/api/attendance', (req, res) => {
  const { studentId, batchId } = req.query;
  const records = store.getAttendance(studentId, batchId);
  res.json({ success: true, attendance: records });
});

app.post('/api/attendance/mark', (req, res) => {
  try {
    const { date, batchId, records } = req.body;
    if (!date || !batchId || !Array.isArray(records)) {
      return res.status(400).json({ error: 'date, batchId, and records array are required' });
    }
    store.markBatchAttendance(date, batchId, records);
    res.json({ success: true, message: 'Attendance recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Payment Routes
app.get('/api/payments', (req, res) => {
  const { studentId } = req.query;
  const records = store.getPayments(studentId);
  res.json({ success: true, payments: records });
});

app.post('/api/payments/record', (req, res) => {
  try {
    const { studentId, studentName, amount, mode, plan, ref } = req.body;
    if (!studentId || !amount) {
      return res.status(400).json({ error: 'studentId and amount are required' });
    }
    const payment = store.recordPayment({ studentId, studentName, amount, mode, plan, ref });
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Admissions Routes
app.get('/api/admissions', (req, res) => {
  res.json({ success: true, admissions: store.getAdmissions() });
});

app.post('/api/admissions/submit', (req, res) => {
  try {
    const { name, phone, style } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone are required' });
    }
    const admission = store.submitAdmission(req.body);
    res.status(201).json({
      success: true,
      message: 'Admission submitted successfully',
      admission
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admissions/:id/approve', (req, res) => {
  try {
    const { batchId } = req.body;
    const result = store.approveAdmission(req.params.id, batchId);
    if (!result) return res.status(404).json({ error: 'Admission application not found' });
    res.json({
      success: true,
      message: 'Admission approved and student enrolled successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Notices Routes
app.get('/api/notices', (req, res) => {
  res.json({ success: true, notices: store.getNotices() });
});

app.post('/api/notices', (req, res) => {
  try {
    const { title, content, tag } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const notice = store.addNotice({ title, content, tag });
    res.status(201).json({ success: true, notice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. KPI Analytics Stats
app.get('/api/stats', (req, res) => {
  res.json({ success: true, stats: store.getStats() });
});

// Root fallback / health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', studio: 'Team Nartan Dance Studio', time: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`💃 TEAM NARTAN DANCE STUDIO SERVER`);
  console.log(`🌐 Running on: http://localhost:${PORT}`);
  console.log(`🔑 Default Master OTP: ${DEFAULT_OTP}`);
  console.log(`📱 Student Portal:   http://localhost:${PORT}/student`);
  console.log(`📝 Admission Form:    http://localhost:${PORT}/admission`);
  console.log(`🏢 Studio Manager:   http://localhost:${PORT}/manager`);
  console.log('====================================================');
});
