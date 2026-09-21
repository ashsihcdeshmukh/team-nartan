// Student Portal Application Logic
const DEFAULT_OTP = "000000";
let currentStudent = null;
let selectedPlan = { months: 3, amount: 5000, name: "3 Months" };

// ── TOAST NOTIFICATIONS ──
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// ── AUTH & OTP LOGIC ──
function quickFillPhone(phone) {
  document.getElementById("loginPhone").value = phone;
  document.getElementById("phoneErr").textContent = "";
}

function autoFillDefaultOtp() {
  const digits = DEFAULT_OTP.split("");
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`otp${i}`);
    if (el) el.value = digits[i - 1];
  }
  showToast("Auto-filled master demo OTP: 000000");
  document.getElementById("btnVerifyOtp").focus();
}

function moveOtp(el, nextId) {
  el.value = el.value.replace(/[^0-9]/g, "").slice(-1);
  if (el.value && nextId) {
    const next = document.getElementById(nextId);
    if (next) next.focus();
  }
}

function backOtp(e, prevId) {
  if (e.key === "Backspace" && !e.target.value && prevId) {
    const prev = document.getElementById(prevId);
    if (prev) prev.focus();
  }
}

function resetLoginStep() {
  document.getElementById("otpStep").style.display = "none";
  document.getElementById("phoneStep").style.display = "block";
  document.getElementById("phoneErr").textContent = "";
  document.getElementById("otpErr").textContent = "";
}

async function sendLoginOtp() {
  const phone = document.getElementById("loginPhone").value.trim().replace(/\D/g, "");
  const errEl = document.getElementById("phoneErr");
  errEl.textContent = "";

  if (phone.length !== 10) {
    errEl.textContent = "Please enter a valid 10-digit mobile number.";
    return;
  }

  const btn = document.getElementById("btnSendOtp");
  btn.disabled = true;
  btn.textContent = "Sending OTP...";

  try {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || "Failed to send OTP.";
      btn.disabled = false;
      btn.textContent = "Send OTP";
      return;
    }

    sessionStorage.setItem("nartan_phone", phone);
    document.getElementById("sentPhoneDisplay").textContent = `+91 ${phone}`;

    // Switch to OTP step
    document.getElementById("phoneStep").style.display = "none";
    document.getElementById("otpStep").style.display = "block";
    for (let i = 1; i <= 6; i++) {
      const el = document.getElementById(`otp${i}`);
      if (el) el.value = "";
    }
    document.getElementById("otp1").focus();
    showToast(`Demo OTP is ready: Use ${DEFAULT_OTP}`);

  } catch (err) {
    errEl.textContent = "Network error. Please try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Send OTP";
  }
}

async function verifyLoginOtp() {
  const phone = sessionStorage.getItem("nartan_phone") || document.getElementById("loginPhone").value.trim().replace(/\D/g, "");
  const otpDigits = [];
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`otp${i}`);
    otpDigits.push(el ? el.value.trim() : "");
  }
  const enteredOtp = otpDigits.join("");
  const errEl = document.getElementById("otpErr");
  errEl.textContent = "";

  if (enteredOtp.length < 6) {
    errEl.textContent = "Please enter all 6 digits of the OTP.";
    return;
  }

  const btn = document.getElementById("btnVerifyOtp");
  btn.disabled = true;
  btn.textContent = "Verifying...";

  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp: enteredOtp })
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || "Incorrect OTP. Default is 000000.";
      btn.disabled = false;
      btn.textContent = "Verify & Enter Portal";
      return;
    }

    // Success! Save session and load portal
    currentStudent = data.student;
    sessionStorage.setItem("nartan_student", JSON.stringify(currentStudent));
    showToast(`Welcome, ${currentStudent.name}!`);
    loadStudentDashboard(currentStudent);

  } catch (err) {
    errEl.textContent = "Network error while verifying OTP.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Verify & Enter Portal";
  }
}

// ── LOGOUT ──
function logoutStudent() {
  sessionStorage.removeItem("nartan_student");
  sessionStorage.removeItem("nartan_phone");
  currentStudent = null;
  document.getElementById("portalView").style.display = "none";
  document.getElementById("authView").style.display = "flex";
  resetLoginStep();
  showToast("Logged out successfully.");
}

// ── TAB SWITCHING ──
function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add("active");
  if (btn) btn.classList.add("active");
}

// ── DASHBOARD LOADER ──
async function loadStudentDashboard(student) {
  document.getElementById("authView").style.display = "none";
  document.getElementById("portalView").style.display = "flex";

  // Header info
  document.getElementById("headerStudentName").textContent = student.name;
  const initials = student.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("headerAvatar").textContent = initials;

  // Membership Card
  document.getElementById("cardName").textContent = student.name;
  document.getElementById("cardStyle").textContent = student.style || "Dance";
  document.getElementById("cardId").textContent = student.id;
  document.getElementById("cardBatch").textContent = student.batchName || "Weekend Morning";
  document.getElementById("cardDueDate").textContent = student.dueDate || "N/A";
  document.getElementById("cardPhoto").src = student.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";

  const isOverdue = student.feeStatus === "Overdue";
  const feeBadge = document.getElementById("cardFeeStatus");
  feeBadge.textContent = student.feeStatus;
  feeBadge.className = isOverdue ? "badge badge-rose" : "badge badge-emerald";

  // Quick stats
  document.getElementById("quickAttendanceRate").textContent = `${student.attendanceRate || 90}%`;
  document.getElementById("quickFeePlan").textContent = student.feePlan || "1M";

  // Fee Tab
  const feeStatusBadge = document.getElementById("feeStatusBadge");
  feeStatusBadge.textContent = student.feeStatus;
  feeStatusBadge.className = isOverdue ? "status-pill-big badge-rose" : "status-pill-big badge-emerald";
  document.getElementById("feeCurrentStatus").textContent = isOverdue ? "Payment Overdue" : "Membership Active";
  document.getElementById("feeDueNotice").textContent = `Due Date: ${student.dueDate}`;

  // Profile Tab
  document.getElementById("profName").textContent = student.name;
  document.getElementById("profPhone").textContent = `+91 ${student.phone}`;
  document.getElementById("profEmail").textContent = student.email || "N/A";
  document.getElementById("profCategory").textContent = `${student.category || 'Adults'} (Age ${student.age || 18})`;
  document.getElementById("profEnrolled").textContent = student.enrolledDate || "2026-01-15";

  // Load API Data: Batches, Notices, Attendance, Payments
  loadNotices();
  loadBatches();
  loadAttendance(student.id);
  loadPayments(student.id);
}

// ── LOAD NOTICES ──
async function loadNotices() {
  try {
    const res = await fetch("/api/notices");
    const data = await res.json();
    const container = document.getElementById("homeNoticesList");
    if (!data.notices || data.notices.length === 0) {
      container.innerHTML = `<div class="text-muted" style="font-size: 13px;">No bulletins right now.</div>`;
      return;
    }
    container.innerHTML = data.notices.slice(0, 3).map(n => `
      <div class="notice-item">
        <div class="notice-title">${n.title}</div>
        <div class="notice-body">${n.content}</div>
        <div class="notice-meta">
          <span>${n.tag || 'Notice'}</span>
          <span>${n.date}</span>
        </div>
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
  }
}

// ── LOAD BATCHES / SCHEDULE ──
async function loadBatches() {
  try {
    const res = await fetch("/api/batches");
    const data = await res.json();
    const container = document.getElementById("scheduleBatchList");
    if (!data.batches) return;

    container.innerHTML = data.batches.map(b => `
      <div class="batch-item">
        <div class="batch-item-title">${b.name}</div>
        <div class="batch-item-meta">
          <div>🕺 <strong>Instructor:</strong> ${b.instructor}</div>
          <div>⏰ <strong>Timings:</strong> ${b.timing}</div>
          <div>📍 <strong>Location:</strong> ${b.room}</div>
          <div style="margin-top: 4px;" class="text-gold">Monthly Fee: ₹${b.feeMonthly}</div>
        </div>
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
  }
}

// ── LOAD ATTENDANCE ──
async function loadAttendance(studentId) {
  try {
    const res = await fetch(`/api/attendance?studentId=${studentId}`);
    const data = await res.json();
    const list = data.attendance || [];

    const presentCount = list.filter(a => a.status === "Present").length;
    const rate = list.length > 0 ? Math.round((presentCount / list.length) * 100) : 92;

    document.getElementById("attOverallPercent").textContent = `${rate}%`;
    document.getElementById("quickSessionsThisMonth").textContent = presentCount;

    const container = document.getElementById("attendanceHistoryList");
    if (list.length === 0) {
      container.innerHTML = `<div class="text-muted" style="font-size: 13px;">No attendance logs yet.</div>`;
      return;
    }

    container.innerHTML = list.map(a => `
      <div class="att-log-item">
        <div>
          <div class="att-log-date">${a.date}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${currentStudent ? currentStudent.batchName : 'Regular Batch'}</div>
        </div>
        <span class="badge ${a.status === 'Present' ? 'badge-emerald' : 'badge-rose'}">${a.status}</span>
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
  }
}

// ── LOAD PAYMENTS ──
async function loadPayments(studentId) {
  try {
    const res = await fetch(`/api/payments?studentId=${studentId}`);
    const data = await res.json();
    const list = data.payments || [];
    const container = document.getElementById("paymentHistoryList");

    if (list.length === 0) {
      container.innerHTML = `<div class="text-muted" style="font-size: 13px;">No payment history recorded yet.</div>`;
      return;
    }

    container.innerHTML = list.map(p => `
      <div class="pay-item">
        <div>
          <div style="font-weight: 700; font-size: 13px;">₹${p.amount} • ${p.plan || 'Renewal'}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${p.date} via ${p.mode}</div>
        </div>
        <span class="badge badge-emerald">Success</span>
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
  }
}

// ── RENEWAL / PAYMENT SIMULATION ──
function selectRenewalPlan(months, amount, el) {
  selectedPlan = { months, amount, name: `${months} Months` };
  document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
}

async function simulateOnlinePayment() {
  if (!currentStudent) return;
  const confirmed = confirm(`Simulate Razorpay payment of ₹${selectedPlan.amount} for ${selectedPlan.name}?`);
  if (!confirmed) return;

  try {
    const res = await fetch("/api/payments/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        amount: selectedPlan.amount,
        mode: "Online / Razorpay Demo",
        plan: selectedPlan.name
      })
    });
    const data = await res.json();

    if (res.ok) {
      showToast(`Payment successful! Renewed for ${selectedPlan.name}.`);
      // Refresh student info
      const sRes = await fetch(`/api/students/${currentStudent.id}`);
      const sData = await sRes.json();
      currentStudent = sData.student;
      sessionStorage.setItem("nartan_student", JSON.stringify(currentStudent));
      loadStudentDashboard(currentStudent);
    }
  } catch (err) {
    showToast("Error processing payment.");
  }
}

function generateCashDeskToken() {
  const token = `TN-CASH-${Math.floor(1000 + Math.random() * 9000)}`;
  alert(`🏢 Cash Payment Desk Request:\n\nStudent: ${currentStudent.name}\nPlan: ${selectedPlan.name} (₹${selectedPlan.amount})\nDesk Verification Token: ${token}\n\nPlease show this token to Team Nartan studio reception desk to settle payment.`);
}

function submitFreezeRequest() {
  const reason = document.getElementById("freezeReason").value.trim();
  if (!reason) {
    alert("Please provide the reason and dates for your membership freeze.");
    return;
  }
  showToast("Freeze request submitted to Studio Manager for approval! ❄️");
  document.getElementById("freezeReason").value = "";
}

// ── INITIAL AUTO-LOGIN RESTORATION ──
window.addEventListener("DOMContentLoaded", () => {
  const saved = sessionStorage.getItem("nartan_student");
  if (saved) {
    try {
      currentStudent = JSON.parse(saved);
      loadStudentDashboard(currentStudent);
    } catch (e) {
      sessionStorage.removeItem("nartan_student");
    }
  }
});
