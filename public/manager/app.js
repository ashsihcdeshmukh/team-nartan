// Studio Manager Dashboard Script
let allStudents = [];
let allBatches = [];
let allAdmissions = [];
let allPayments = [];
let allNotices = [];
let currentBatchStudents = [];

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── NAVIGATION ──
function showView(viewId, btn) {
  document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const view = document.getElementById(`view-${viewId}`);
  if (view) view.style.display = 'block';
  if (btn) btn.classList.add('active');

  const titles = {
    dashboard: ['Dashboard Overview', 'Executive metrics and studio health'],
    students: ['Dancer Directory', 'All enrolled students across batches'],
    attendance: ['Attendance Marker Console', 'Batch-wise daily check-ins and logs'],
    payments: ['Ledger & Collections', 'Fee renewals, receipts, and outstanding dues'],
    admissions: ['Admissions Desk', 'Review and enroll incoming applicants'],
    notices: ['Studio Bulletins', 'Broadcast alerts and workshop announcements']
  };

  if (titles[viewId]) {
    document.getElementById('viewTitle').textContent = titles[viewId][0];
    document.getElementById('viewSubtitle').textContent = titles[viewId][1];
  }

  if (viewId === 'attendance') {
    loadBatchForAttendance();
  }
}

// ── DATA FETCHING ──
async function refreshAllData() {
  await Promise.all([
    fetchStats(),
    fetchBatches(),
    fetchStudents(),
    fetchAdmissions(),
    fetchPayments(),
    fetchNotices()
  ]);
  showToast('Studio data updated.');
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.stats) {
      document.getElementById('kpiActiveStudents').textContent = data.stats.activeStudents;
      document.getElementById('kpiRevenue').textContent = `₹${data.stats.totalRevenue.toLocaleString()}`;
      document.getElementById('kpiOverdue').textContent = data.stats.overdueCount;
      document.getElementById('kpiAttendance').textContent = `${data.stats.avgAttendance}%`;
    }
  } catch (e) {
    console.error(e);
  }
}

async function fetchBatches() {
  try {
    const res = await fetch('/api/batches');
    const data = await res.json();
    allBatches = data.batches || [];

    // Populate filter in students view
    const filter = document.getElementById('batchFilter');
    filter.innerHTML = '<option value="ALL">All Batches</option>' +
      allBatches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    // Populate attendance batch selector
    const attSelect = document.getElementById('attBatchSelect');
    attSelect.innerHTML = allBatches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    // Populate add student modal batch selector
    const modalSelect = document.getElementById('mStudentBatch');
    modalSelect.innerHTML = allBatches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

  } catch (e) {
    console.error(e);
  }
}

async function fetchStudents() {
  try {
    const res = await fetch('/api/students');
    const data = await res.json();
    allStudents = data.students || [];

    renderStudentsTable();
    renderOverdueDashboard();

    // Populate payment student selector
    const paySelect = document.getElementById('payStudentSelect');
    paySelect.innerHTML = allStudents.map(s => `<option value="${s.id}">${s.name} (${s.phone})</option>`).join('');

  } catch (e) {
    console.error(e);
  }
}

async function fetchAdmissions() {
  try {
    const res = await fetch('/api/admissions');
    const data = await res.json();
    allAdmissions = data.admissions || [];

    const pendingCount = allAdmissions.filter(a => a.status === 'Pending').length;
    document.getElementById('admBadgeCount').textContent = pendingCount;

    renderAdmissionsTable();
  } catch (e) {
    console.error(e);
  }
}

async function fetchPayments() {
  try {
    const res = await fetch('/api/payments');
    const data = await res.json();
    allPayments = data.payments || [];
    renderPaymentsTable();
  } catch (e) {
    console.error(e);
  }
}

async function fetchNotices() {
  try {
    const res = await fetch('/api/notices');
    const data = await res.json();
    allNotices = data.notices || [];
    renderNoticesTable();
  } catch (e) {
    console.error(e);
  }
}

// ── RENDER TABLES ──
function renderStudentsTable() {
  const query = (document.getElementById('studentSearch').value || '').toLowerCase();
  const batchId = document.getElementById('batchFilter').value;

  const filtered = allStudents.filter(s => {
    const matchQuery = s.name.toLowerCase().includes(query) ||
                       s.phone.includes(query) ||
                       (s.style || '').toLowerCase().includes(query);
    const matchBatch = batchId === 'ALL' || s.batchId === batchId;
    return matchQuery && matchBatch;
  });

  const tbody = document.getElementById('studentsTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td><span style="font-family: monospace; color: var(--accent-gold);">${s.id}</span></td>
      <td><strong>${s.name}</strong></td>
      <td>${s.phone}</td>
      <td>${s.style}</td>
      <td>${s.batchName}</td>
      <td><span class="badge ${s.feeStatus === 'Paid' ? 'badge-emerald' : 'badge-rose'}">${s.feeStatus}</span></td>
      <td><strong>${s.attendanceRate || 90}%</strong></td>
      <td>
        <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px;" onclick="viewStudentDetails('${s.id}')">View</button>
      </td>
    </tr>
  `).join('');
}

function renderOverdueDashboard() {
  const overdue = allStudents.filter(s => s.feeStatus === 'Overdue');
  const tbody = document.getElementById('overdueTableBody');

  if (overdue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #10b981;">🎉 No pending overdue fees. All students are in good standing!</td></tr>`;
    return;
  }

  tbody.innerHTML = overdue.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.phone}</td>
      <td>${s.batchName}</td>
      <td>${s.feePlan}</td>
      <td><span class="text-rose font-weight-bold">${s.dueDate}</span></td>
      <td>
        <button class="btn btn-outline-gold" style="font-size: 11px; padding: 4px 8px;" onclick="sendOverdueReminder('${s.name}', '${s.phone}')">
          📲 Send WhatsApp Reminder
        </button>
      </td>
    </tr>
  `).join('');
}

function renderAdmissionsTable() {
  const tbody = document.getElementById('admissionsTableBody');
  const dashTbody = document.getElementById('dashAdmissionsTableBody');

  if (allAdmissions.length === 0) {
    const emptyRow = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No admission applications received yet.</td></tr>`;
    tbody.innerHTML = emptyRow;
    dashTbody.innerHTML = emptyRow;
    return;
  }

  const rows = allAdmissions.map(a => `
    <tr>
      <td><span style="font-family: monospace; color: var(--accent-gold);">${a.id}</span></td>
      <td><strong>${a.name}</strong></td>
      <td>+91 ${a.phone}</td>
      <td>Age ${a.age} (${a.gender})</td>
      <td>${a.style} • ${a.batchPreference}</td>
      <td>${a.feePlan}</td>
      <td><span class="badge ${a.status === 'Approved' ? 'badge-emerald' : 'badge-gold'}">${a.status}</span></td>
      <td>
        ${a.status === 'Pending' ? `
          <button class="btn btn-primary" style="font-size: 11px; padding: 4px 10px;" onclick="approveAdmission('${a.id}')">
            Approve & Enroll 🎓
          </button>
        ` : `<span class="text-muted" style="font-size: 11px;">Enrolled</span>`}
      </td>
    </tr>
  `).join('');

  tbody.innerHTML = rows;
  dashTbody.innerHTML = allAdmissions.slice(0, 4).map(a => `
    <tr>
      <td><span style="font-family: monospace; color: var(--accent-gold);">${a.id}</span></td>
      <td><strong>${a.name}</strong></td>
      <td>+91 ${a.phone}</td>
      <td>${a.style}</td>
      <td>${a.feePlan}</td>
      <td><span class="badge ${a.status === 'Approved' ? 'badge-emerald' : 'badge-gold'}">${a.status}</span></td>
      <td>
        ${a.status === 'Pending' ? `
          <button class="btn btn-primary" style="font-size: 11px; padding: 4px 10px;" onclick="approveAdmission('${a.id}')">
            Approve 🎓
          </button>
        ` : `<span class="text-muted" style="font-size: 11px;">Enrolled</span>`}
      </td>
    </tr>
  `).join('');
}

function renderPaymentsTable() {
  const tbody = document.getElementById('paymentsTableBody');
  if (allPayments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No payment logs.</td></tr>`;
    return;
  }

  tbody.innerHTML = allPayments.map(p => `
    <tr>
      <td><span style="font-family: monospace; color: var(--accent-gold);">${p.id}</span></td>
      <td><strong>${p.studentName}</strong></td>
      <td><strong class="text-emerald">₹${p.amount}</strong></td>
      <td>${p.plan || 'Regular'}</td>
      <td>${p.date}</td>
      <td>${p.mode}</td>
      <td><span class="badge badge-emerald">Success</span></td>
    </tr>
  `).join('');
}

function renderNoticesTable() {
  const tbody = document.getElementById('noticesTableBody');
  if (allNotices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No notices posted.</td></tr>`;
    return;
  }

  tbody.innerHTML = allNotices.map(n => `
    <tr>
      <td><strong>${n.title}</strong></td>
      <td><span class="badge badge-gold">${n.tag || 'Notice'}</span></td>
      <td>${n.date}</td>
      <td style="color: var(--text-muted);">${n.content.slice(0, 60)}...</td>
    </tr>
  `).join('');
}

// ── ATTENDANCE MARKER CONSOLE ──
async function loadBatchForAttendance() {
  const batchId = document.getElementById('attBatchSelect').value;
  const batch = allBatches.find(b => b.id === batchId);
  if (!batch) return;

  document.getElementById('attPanelBatchTitle').textContent = `${batch.name} — Student Check-in`;
  currentBatchStudents = allStudents.filter(s => s.batchId === batchId);
  document.getElementById('attStudentCountDisplay').textContent = `${currentBatchStudents.length} students enrolled`;

  const tbody = document.getElementById('attMarkerTableBody');
  if (currentBatchStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No students in this batch yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentBatchStudents.map(s => `
    <tr id="attRow-${s.id}">
      <td><span style="font-family: monospace; color: var(--accent-gold);">${s.id}</span></td>
      <td><strong>${s.name}</strong></td>
      <td>${s.phone}</td>
      <td>${s.attendanceRate || 90}%</td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary att-btn-present active" id="btnP-${s.id}" style="font-size: 12px; padding: 4px 12px;" onclick="toggleAttStatus('${s.id}', 'Present')">
            Present
          </button>
          <button type="button" class="btn btn-secondary att-btn-absent" id="btnA-${s.id}" style="font-size: 12px; padding: 4px 12px;" onclick="toggleAttStatus('${s.id}', 'Absent')">
            Absent
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

const attendanceStates = {};

function toggleAttStatus(studentId, status) {
  attendanceStates[studentId] = status;
  const btnP = document.getElementById(`btnP-${studentId}`);
  const btnA = document.getElementById(`btnA-${studentId}`);

  if (status === 'Present') {
    btnP.className = 'btn btn-primary att-btn-present active';
    btnA.className = 'btn btn-secondary att-btn-absent';
  } else {
    btnA.className = 'btn btn-outline-gold att-btn-absent active';
    btnP.className = 'btn btn-secondary att-btn-present';
  }
}

function markAllPresent() {
  currentBatchStudents.forEach(s => toggleAttStatus(s.id, 'Present'));
  showToast('Marked all students as Present!');
}

async function saveBatchAttendance() {
  const date = document.getElementById('attDate').value || new Date().toISOString().slice(0, 10);
  const batchId = document.getElementById('attBatchSelect').value;

  const records = currentBatchStudents.map(s => ({
    studentId: s.id,
    status: attendanceStates[s.id] || 'Present'
  }));

  try {
    const res = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, batchId, records })
    });
    if (res.ok) {
      showToast(`Attendance successfully saved for ${records.length} students! 📝`);
      await fetchStudents();
      await fetchStats();
    }
  } catch (err) {
    showToast('Failed to save attendance.');
  }
}

// ── ACTIONS ──
async function approveAdmission(admissionId) {
  const adm = allAdmissions.find(a => a.id === admissionId);
  const confirmed = confirm(`Approve admission for ${adm ? adm.name : 'applicant'} and enroll them into active classes?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admissions/${admissionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId: 'batch-2' })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Approved! Enrolled as ${data.result.student.name} (${data.result.student.id}) 🎓`);
      await refreshAllData();
    }
  } catch (err) {
    showToast('Failed to approve admission.');
  }
}

function sendOverdueReminder(name, phone) {
  const msg = `Reminder: Dear ${name}, your monthly dance membership fee at Team Nartan Dance Studio is currently overdue. Please login to your Student Portal using default OTP 000000 or visit reception to renew your pass.`;
  alert(`📲 Simulated WhatsApp Fee Reminder sent to ${phone}:\n\n"${msg}"`);
}

function viewStudentDetails(studentId) {
  const s = allStudents.find(st => st.id === studentId);
  if (!s) return;
  alert(`💃 Dancer Profile: ${s.name}\n\n• Student ID: ${s.id}\n• Mobile: ${s.phone}\n• Style: ${s.style}\n• Batch: ${s.batchName}\n• Fee Status: ${s.feeStatus}\n• Plan: ${s.feePlan}\n• Renewal Due: ${s.dueDate}\n• Attendance: ${s.attendanceRate}%\n• Notes: ${s.notes || 'None'}`);
}

async function publishNotice() {
  const title = document.getElementById('noticeTitle').value.trim();
  const content = document.getElementById('noticeContent').value.trim();
  const tag = document.getElementById('noticeTag').value;

  if (!title || !content) {
    alert('Please enter both title and content.');
    return;
  }

  try {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tag })
    });
    if (res.ok) {
      showToast('Notice broadcasted to all student portals! 📢');
      document.getElementById('noticeTitle').value = '';
      document.getElementById('noticeContent').value = '';
      await fetchNotices();
    }
  } catch (err) {
    showToast('Failed to publish notice.');
  }
}

// ── MODALS ──
function openAddStudentModal() {
  document.getElementById('addStudentModal').classList.add('active');
}

function openRecordPaymentModal() {
  document.getElementById('recordPaymentModal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function saveNewStudent(e) {
  e.preventDefault();
  const batchId = document.getElementById('mStudentBatch').value;
  const batch = allBatches.find(b => b.id === batchId);

  const payload = {
    name: document.getElementById('mStudentName').value.trim(),
    phone: document.getElementById('mStudentPhone').value.trim(),
    age: document.getElementById('mStudentAge').value.trim(),
    batchId: batchId,
    batchName: batch ? batch.name : 'Bollywood Commercial',
    style: batch ? batch.style : 'Bollywood',
    feePlan: document.getElementById('mStudentPlan').value,
    feeAmount: document.getElementById('mStudentAmount').value
  };

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('addStudentModal');
      showToast(`Student ${payload.name} enrolled successfully! 🌟`);
      await refreshAllData();
    }
  } catch (err) {
    showToast('Failed to enroll student.');
  }
}

async function savePayment(e) {
  e.preventDefault();
  const studentId = document.getElementById('payStudentSelect').value;
  const student = allStudents.find(s => s.id === studentId);

  const payload = {
    studentId: studentId,
    studentName: student ? student.name : 'Student',
    amount: document.getElementById('payAmount').value,
    plan: document.getElementById('payPlan').value,
    mode: document.getElementById('payMode').value
  };

  try {
    const res = await fetch('/api/payments/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('recordPaymentModal');
      showToast('Payment recorded and student status updated! 💳');
      await refreshAllData();
    }
  } catch (err) {
    showToast('Failed to record payment.');
  }
}

// ── INITIAL LOAD ──
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('attDate').value = new Date().toISOString().slice(0, 10);
  refreshAllData();
});
