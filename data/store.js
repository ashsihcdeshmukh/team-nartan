const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Store] Error reading db.json:', err);
    return {
      studioInfo: {
        name: "Team Nartan Dance Studio",
        defaultOtp: "000000"
      },
      batches: [],
      students: [],
      attendance: [],
      payments: [],
      notices: [],
      admissions: []
    };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Store] Error writing db.json:', err);
    return false;
  }
}

// Student Helpers
function getStudents() {
  return readDb().students || [];
}

function findStudentByPhone(phone) {
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/\D/g, '');
  const last10 = cleanPhone.slice(-10);
  const students = getStudents();
  return students.find(s => {
    const p = String(s.phone).replace(/\D/g, '');
    return p === last10 || p.slice(-10) === last10;
  }) || null;
}

function findStudentById(id) {
  const students = getStudents();
  return students.find(s => s.id === id) || null;
}

function addStudent(studentData) {
  const db = readDb();
  const nextNum = (db.students.length + 1).toString().padStart(3, '0');
  const newStudent = {
    id: studentData.id || `TN-2026-${nextNum}`,
    name: studentData.name,
    phone: String(studentData.phone).replace(/\D/g, '').slice(-10),
    email: studentData.email || '',
    age: Number(studentData.age || 18),
    gender: studentData.gender || 'Not specified',
    category: studentData.category || (studentData.age < 16 ? 'Kids & Teens' : 'Adults'),
    style: studentData.style || 'Bollywood',
    batchId: studentData.batchId || 'batch-2',
    batchName: studentData.batchName || 'Bollywood Commercial (MWF)',
    enrolledDate: studentData.enrolledDate || new Date().toISOString().slice(0, 10),
    feePlan: studentData.feePlan || '1 Month',
    feeAmount: Number(studentData.feeAmount || 1800),
    feeStatus: studentData.feeStatus || 'Paid',
    dueDate: studentData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    lastPaymentDate: studentData.lastPaymentDate || new Date().toISOString().slice(0, 10),
    attendanceRate: 100,
    photo: studentData.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    notes: studentData.notes || 'Enrolled directly via Studio Manager'
  };

  db.students.push(newStudent);
  writeDb(db);
  return newStudent;
}

function updateStudent(id, updates) {
  const db = readDb();
  const idx = db.students.findIndex(s => s.id === id);
  if (idx === -1) return null;
  db.students[idx] = { ...db.students[idx], ...updates };
  writeDb(db);
  return db.students[idx];
}

// Attendance Helpers
function getAttendance(studentId, batchId) {
  const db = readDb();
  let att = db.attendance || [];
  if (studentId) att = att.filter(a => a.studentId === studentId);
  if (batchId) att = att.filter(a => a.batchId === batchId);
  return att;
}

function markBatchAttendance(date, batchId, records) {
  // records: [{ studentId, status: 'Present'|'Absent' }]
  const db = readDb();
  if (!db.attendance) db.attendance = [];

  records.forEach(rec => {
    const existingIdx = db.attendance.findIndex(a => a.studentId === rec.studentId && a.date === date);
    if (existingIdx >= 0) {
      db.attendance[existingIdx].status = rec.status;
      db.attendance[existingIdx].batchId = batchId;
    } else {
      db.attendance.push({
        studentId: rec.studentId,
        date: date,
        status: rec.status,
        batchId: batchId
      });
    }

    // Recalculate student attendance rate
    const studentRecords = db.attendance.filter(a => a.studentId === rec.studentId);
    const presentCount = studentRecords.filter(a => a.status === 'Present').length;
    const rate = Math.round((presentCount / (studentRecords.length || 1)) * 100);
    const sIdx = db.students.findIndex(s => s.id === rec.studentId);
    if (sIdx >= 0) {
      db.students[sIdx].attendanceRate = rate;
    }
  });

  writeDb(db);
  return true;
}

// Payments Helpers
function getPayments(studentId) {
  const db = readDb();
  let pays = db.payments || [];
  if (studentId) pays = pays.filter(p => p.studentId === studentId);
  return pays;
}

function recordPayment(paymentData) {
  const db = readDb();
  const payment = {
    id: `PAY-${Date.now().toString().slice(-6)}`,
    studentId: paymentData.studentId,
    studentName: paymentData.studentName,
    amount: Number(paymentData.amount),
    date: paymentData.date || new Date().toISOString().slice(0, 10),
    mode: paymentData.mode || 'Online / Razorpay',
    plan: paymentData.plan || '1 Month',
    status: 'Success',
    ref: paymentData.ref || `ref_${Math.random().toString(36).slice(2, 9)}`
  };

  db.payments.unshift(payment);

  // Update student fee status and due date
  const sIdx = db.students.findIndex(s => s.id === paymentData.studentId);
  if (sIdx >= 0) {
    const durationMonths = paymentData.plan.includes('12') ? 12 :
                           paymentData.plan.includes('6') ? 6 :
                           paymentData.plan.includes('3') ? 3 : 1;
    const newDueDate = new Date();
    newDueDate.setMonth(newDueDate.getMonth() + durationMonths);

    db.students[sIdx].feeStatus = 'Paid';
    db.students[sIdx].feePlan = paymentData.plan;
    db.students[sIdx].dueDate = newDueDate.toISOString().slice(0, 10);
    db.students[sIdx].lastPaymentDate = payment.date;
  }

  writeDb(db);
  return payment;
}

// Admissions Helpers
function getAdmissions() {
  return readDb().admissions || [];
}

function submitAdmission(formData) {
  const db = readDb();
  const newAdmission = {
    id: `ADM-${Date.now().toString().slice(-4)}`,
    name: formData.name,
    phone: String(formData.phone).replace(/\D/g, '').slice(-10),
    email: formData.email || '',
    age: Number(formData.age || 18),
    gender: formData.gender || 'Not specified',
    parentName: formData.parentName || '',
    style: formData.style || 'Bollywood',
    batchPreference: formData.batchPreference || 'Bollywood Commercial (MWF)',
    feePlan: formData.feePlan || '1 Month',
    submittedAt: new Date().toISOString(),
    status: 'Pending',
    priorExperience: formData.priorExperience || 'None',
    notes: formData.notes || ''
  };

  db.admissions.unshift(newAdmission);
  writeDb(db);
  return newAdmission;
}

function approveAdmission(admissionId, batchId) {
  const db = readDb();
  const admIdx = db.admissions.findIndex(a => a.id === admissionId);
  if (admIdx === -1) return null;

  const adm = db.admissions[admIdx];
  adm.status = 'Approved';
  writeDb(db);

  // Convert to student
  const batch = db.batches.find(b => b.id === batchId) || db.batches[0];
  const newStudent = addStudent({
    name: adm.name,
    phone: adm.phone,
    email: adm.email,
    age: adm.age,
    gender: adm.gender,
    style: adm.style,
    batchId: batch.id,
    batchName: batch.name,
    feePlan: adm.feePlan,
    feeAmount: batch.feeMonthly,
    feeStatus: 'Paid',
    notes: `Enrolled from online admission application #${adm.id}`
  });

  return { admission: adm, student: newStudent };
}

// Notices Helpers
function getNotices() {
  return readDb().notices || [];
}

function addNotice(noticeData) {
  const db = readDb();
  const notice = {
    id: `not-${Date.now()}`,
    title: noticeData.title,
    date: new Date().toISOString().slice(0, 10),
    tag: noticeData.tag || 'Notice',
    content: noticeData.content
  };
  db.notices.unshift(notice);
  writeDb(db);
  return notice;
}

// KPI Stats
function getStats() {
  const db = readDb();
  const students = db.students || [];
  const payments = db.payments || [];
  const admissions = db.admissions || [];

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.feeStatus !== 'Cancelled').length;
  const overdueCount = students.filter(s => s.feeStatus === 'Overdue').length;
  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingAdmissions = admissions.filter(a => a.status === 'Pending').length;

  const avgAttendance = Math.round(
    students.reduce((sum, s) => sum + (Number(s.attendanceRate) || 0), 0) / (totalStudents || 1)
  );

  return {
    totalStudents,
    activeStudents,
    overdueCount,
    totalRevenue,
    pendingAdmissions,
    avgAttendance
  };
}

module.exports = {
  readDb,
  writeDb,
  getStudents,
  findStudentByPhone,
  findStudentById,
  addStudent,
  updateStudent,
  getAttendance,
  markBatchAttendance,
  getPayments,
  recordPayment,
  getAdmissions,
  submitAdmission,
  approveAdmission,
  getNotices,
  addNotice,
  getStats
};
