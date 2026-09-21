/**
 * Team Nartan Isolated Client-Side Database & Sandbox
 * 
 * 100% Isolated: Completely intercepts and replaces external Supabase connections
 * so ZERO client data from Creative Edge is ever requested, fetched, or exposed.
 */

(function() {
  // Purge any legacy Creative Edge keys from localStorage
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('creative-edge-') || k.includes('ce_students') || k.includes('flzreearlfdultvspdmx') || k === 'ce_manager_students')) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}

  const TODAY = new Date().toISOString().split('T')[0];

  const INITIAL_STUDENTS = [
    {
      id: "TN-2026-001",
      name: "Aarav Sharma",
      phone: "9876543210",
      category: "Adults",
      batch: "Kathak Classical (Weekend 10:00 AM - 11:30 AM)",
      dance_style: "Kathak",
      fee_plan: "3 Months",
      fee_amount: 6000,
      monthly_fee: 6000,
      fee_status: "paid",
      due_date: "2026-10-15",
      next_due_date: "2026-10-15",
      enrolled_date: "2026-07-15",
      admission_date: "2026-07-15",
      last_paid_date: "2026-07-15",
      created_at: "2026-07-15T10:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-001",
      payment_method: "online",
      notes: "Style: Kathak; Address: Station Road, Mumbai\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-001\",\"amount\":6000,\"type\":\"Admission Package\",\"title\":\"Kathak Classical (3 Months)\",\"date\":\"2026-07-15\",\"mode\":\"Razorpay Online\",\"duration_months\":3}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-002",
      name: "Pooja Patel",
      phone: "9823417856",
      category: "Adults",
      batch: "Bollywood Commercial (MWF 6:00 PM - 7:00 PM)",
      dance_style: "Bollywood",
      fee_plan: "1 Month",
      fee_amount: 1800,
      monthly_fee: 1800,
      fee_status: "paid",
      due_date: "2026-09-25",
      next_due_date: "2026-09-25",
      enrolled_date: "2026-08-25",
      admission_date: "2026-08-25",
      last_paid_date: "2026-08-25",
      created_at: "2026-08-25T11:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-002",
      payment_method: "cash",
      notes: "Style: Bollywood; Address: Rhythm Heights, Studio District\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-002\",\"amount\":1800,\"type\":\"Admission Package\",\"title\":\"Bollywood Commercial (1 Month)\",\"date\":\"2026-08-25\",\"mode\":\"Cash\",\"duration_months\":1}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-003",
      name: "Rohan Mehta",
      phone: "9988776655",
      category: "Adults",
      batch: "Urban Hip-Hop & Popping (TTS 7:00 PM - 8:30 PM)",
      dance_style: "Hip-Hop",
      fee_plan: "3 Months",
      fee_amount: 5500,
      monthly_fee: 5500,
      fee_status: "paid",
      due_date: "2026-10-01",
      next_due_date: "2026-10-01",
      enrolled_date: "2026-06-01",
      admission_date: "2026-06-01",
      last_paid_date: "2026-06-01",
      created_at: "2026-06-01T09:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-003",
      payment_method: "online",
      notes: "Style: Hip-Hop; Address: Bandra West, Mumbai\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-003\",\"amount\":5500,\"type\":\"Admission Package\",\"title\":\"Urban Hip-Hop (3 Months)\",\"date\":\"2026-06-01\",\"mode\":\"Razorpay Online\",\"duration_months\":3}]<!--PAY_END-->\n<!--LEAVE_REQ_START-->[{\"id\":\"REQ-2026-001\",\"start\":\"2026-09-24\",\"end\":\"2026-09-28\",\"days\":5,\"reason\":\"College Semester Examinations\",\"status\":\"pending\",\"created_at\":\"2026-09-21\"}]<!--LEAVE_REQ_END-->"
    },
    {
      id: "TN-2026-004",
      name: "Ananya Verma",
      phone: "9123456789",
      category: "Adults",
      batch: "Contemporary & Movement (Sat/Sun 4:00 PM - 5:30 PM)",
      dance_style: "Contemporary",
      fee_plan: "3 Months",
      fee_amount: 6500,
      monthly_fee: 6500,
      fee_status: "paid",
      due_date: "2026-11-10",
      next_due_date: "2026-11-10",
      enrolled_date: "2026-05-10",
      admission_date: "2026-05-10",
      last_paid_date: "2026-08-10",
      created_at: "2026-05-10T09:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-004",
      payment_method: "online",
      notes: "Style: Contemporary; Address: Juhu, Mumbai\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-004\",\"amount\":6500,\"type\":\"Package Renewal\",\"title\":\"Contemporary Movement (3 Months)\",\"date\":\"2026-08-10\",\"mode\":\"Razorpay Online\",\"duration_months\":3}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-005",
      name: "Kabir Joshi",
      phone: "9765432109",
      category: "Adults",
      batch: "Urban Hip-Hop & Popping (TTS 7:00 PM - 8:30 PM)",
      dance_style: "Hip-Hop",
      fee_plan: "6 Months",
      fee_amount: 10500,
      monthly_fee: 10500,
      fee_status: "paid",
      due_date: "2026-10-10",
      next_due_date: "2026-10-10",
      enrolled_date: "2026-04-10",
      admission_date: "2026-04-10",
      last_paid_date: "2026-04-10",
      created_at: "2026-04-10T14:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-005",
      payment_method: "cash",
      notes: "Style: Hip-Hop; Address: Andheri West\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-005\",\"amount\":10500,\"type\":\"Admission Package\",\"title\":\"Hip-Hop 6-Month Intensive\",\"date\":\"2026-04-10\",\"mode\":\"Cash\",\"duration_months\":6}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-006",
      name: "Priya Singh",
      phone: "9811223344",
      category: "Adults",
      batch: "Kathak Classical (Weekend 10:00 AM - 11:30 AM)",
      dance_style: "Kathak",
      fee_plan: "1 Month",
      fee_amount: 2200,
      monthly_fee: 2200,
      fee_status: "paid",
      due_date: "2026-09-20",
      next_due_date: "2026-09-20",
      enrolled_date: "2026-08-20",
      admission_date: "2026-08-20",
      last_paid_date: "2026-08-20",
      created_at: "2026-08-20T10:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-006",
      payment_method: "online",
      notes: "Style: Kathak; Address: Dadar, Mumbai\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-006\",\"amount\":2200,\"type\":\"Admission Package\",\"title\":\"Kathak 1-Month\",\"date\":\"2026-08-20\",\"mode\":\"UPI Online\",\"duration_months\":1}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-007",
      name: "Vikram Malhotra",
      phone: "9933445566",
      category: "Adults",
      batch: "Morning Zumba & Dance Fitness (Mon-Fri 7:00 AM - 8:00 AM)",
      dance_style: "Zumba",
      fee_plan: "1 Month",
      fee_amount: 1600,
      monthly_fee: 1600,
      fee_status: "paid",
      due_date: "2026-10-01",
      next_due_date: "2026-10-01",
      enrolled_date: "2026-09-01",
      admission_date: "2026-09-01",
      last_paid_date: "2026-09-01",
      created_at: "2026-09-01T07:30:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-007",
      payment_method: "online",
      notes: "Style: Zumba; Address: Lower Parel, Mumbai\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-007\",\"amount\":1600,\"type\":\"Admission Package\",\"title\":\"Zumba Morning Batch\",\"date\":\"2026-09-01\",\"mode\":\"Razorpay Online\",\"duration_months\":1}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-008",
      name: "Neha Kulkarni",
      phone: "9845012345",
      category: "Adults",
      batch: "Bollywood Commercial (MWF 6:00 PM - 7:00 PM)",
      dance_style: "Bollywood",
      fee_plan: "3 Months",
      fee_amount: 4800,
      monthly_fee: 4800,
      fee_status: "paid",
      due_date: "2026-10-01",
      next_due_date: "2026-10-01",
      enrolled_date: "2026-07-01",
      admission_date: "2026-07-01",
      last_paid_date: "2026-07-01",
      created_at: "2026-07-01T17:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-008",
      payment_method: "online",
      notes: "Style: Bollywood; Address: Chembur, Mumbai\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-008\",\"amount\":4800,\"type\":\"Admission Package\",\"title\":\"Bollywood 3 Months Package\",\"date\":\"2026-07-01\",\"mode\":\"Razorpay Online\",\"duration_months\":3}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-009",
      name: "Siddharth Rao",
      phone: "9731234567",
      category: "Kids",
      parent_name: "Manish Rao",
      batch: "Kids Dance Foundations (MWF 5:00 PM - 6:00 PM)",
      dance_style: "Kids Dance",
      fee_plan: "3 Months",
      fee_amount: 3000,
      monthly_fee: 3000,
      fee_status: "paid",
      due_date: "2026-11-01",
      next_due_date: "2026-11-01",
      enrolled_date: "2026-08-01",
      admission_date: "2026-08-01",
      last_paid_date: "2026-08-01",
      created_at: "2026-08-01T16:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-009",
      payment_method: "cash",
      notes: "Style: Kids Dance; Parent: Manish Rao; Address: Vile Parle\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-009\",\"amount\":3000,\"type\":\"Admission Package\",\"title\":\"Kids Dance 3 Months\",\"date\":\"2026-08-01\",\"mode\":\"Cash\",\"duration_months\":3}]<!--PAY_END-->"
    },
    {
      id: "TN-2026-010",
      name: "Tanvi Deshmukh",
      phone: "9820011223",
      category: "Adults",
      batch: "Contemporary & Movement (Sat/Sun 4:00 PM - 5:30 PM)",
      dance_style: "Contemporary",
      fee_plan: "6 Months",
      fee_amount: 10500,
      monthly_fee: 10500,
      fee_status: "paid",
      due_date: "2026-09-26",
      next_due_date: "2026-09-26",
      enrolled_date: "2026-03-26",
      admission_date: "2026-03-26",
      last_paid_date: "2026-03-26",
      created_at: "2026-03-26T12:00:00.000Z",
      status: "Active",
      payment_id: "PAY-TN-010",
      payment_method: "online",
      notes: "Style: Contemporary; Address: Thane West\n<!--PAY_START-->[{\"payment_id\":\"PAY-TN-010\",\"amount\":10500,\"type\":\"Admission Package\",\"title\":\"Contemporary 6 Months\",\"date\":\"2026-03-26\",\"mode\":\"Razorpay Online\",\"duration_months\":6}]<!--PAY_END-->"
    }
  ];

  const INITIAL_PAYMENTS = [
    { id: "PAY-TN-001", student_id: "TN-2026-001", student_name: "Aarav Sharma", amount: 6000, payment_date: "2026-07-15", mode: "Razorpay Online", type: "Admission Package", title: "Kathak Classical (3 Months)" },
    { id: "PAY-TN-002", student_id: "TN-2026-002", student_name: "Pooja Patel", amount: 1800, payment_date: "2026-08-25", mode: "Cash", type: "Admission Package", title: "Bollywood Commercial (1 Month)" },
    { id: "PAY-TN-003", student_id: "TN-2026-003", student_name: "Rohan Mehta", amount: 5500, payment_date: "2026-06-01", mode: "Razorpay Online", type: "Admission Package", title: "Urban Hip-Hop (3 Months)" },
    { id: "PAY-TN-004", student_id: "TN-2026-004", student_name: "Ananya Verma", amount: 6500, payment_date: "2026-08-10", mode: "Razorpay Online", type: "Package Renewal", title: "Contemporary Movement (3 Months)" },
    { id: "PAY-TN-005", student_id: "TN-2026-005", student_name: "Kabir Joshi", amount: 10500, payment_date: "2026-04-10", mode: "Cash", type: "Admission Package", title: "Hip-Hop 6-Month Intensive" },
    { id: "PAY-TN-006", student_id: "TN-2026-006", student_name: "Priya Singh", amount: 2200, payment_date: "2026-08-20", mode: "UPI Online", type: "Admission Package", title: "Kathak 1-Month" },
    { id: "PAY-TN-007", student_id: "TN-2026-007", student_name: "Vikram Malhotra", amount: 1600, payment_date: "2026-09-01", mode: "Razorpay Online", type: "Admission Package", title: "Zumba Morning Batch" },
    { id: "PAY-TN-008", student_id: "TN-2026-008", student_name: "Neha Kulkarni", amount: 4800, payment_date: "2026-07-01", mode: "Razorpay Online", type: "Admission Package", title: "Bollywood 3 Months Package" },
    { id: "PAY-TN-009", student_id: "TN-2026-009", student_name: "Siddharth Rao", amount: 3000, payment_date: "2026-08-01", mode: "Cash", type: "Admission Package", title: "Kids Dance 3 Months" },
    { id: "PAY-TN-010", student_id: "TN-2026-010", student_name: "Tanvi Deshmukh", amount: 10500, payment_date: "2026-03-26", mode: "Razorpay Online", type: "Admission Package", title: "Contemporary 6 Months" }
  ];

  const INITIAL_ATTENDANCE = [
    { id: "ATT-101", student_id: "TN-2026-001", student_name: "Aarav Sharma", phone: "9876543210", batch: "Kathak Classical (Weekend 10:00 AM - 11:30 AM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-102", student_id: "TN-2026-002", student_name: "Pooja Patel", phone: "9823417856", batch: "Bollywood Commercial (MWF 6:00 PM - 7:00 PM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-103", student_id: "TN-2026-003", student_name: "Rohan Mehta", phone: "9988776655", batch: "Urban Hip-Hop & Popping (TTS 7:00 PM - 8:30 PM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-104", student_id: "TN-2026-004", student_name: "Ananya Verma", phone: "9123456789", batch: "Contemporary & Movement (Sat/Sun 4:00 PM - 5:30 PM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-105", student_id: "TN-2026-005", student_name: "Kabir Joshi", phone: "9765432109", batch: "Urban Hip-Hop & Popping (TTS 7:00 PM - 8:30 PM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-106", student_id: "TN-2026-006", student_name: "Priya Singh", phone: "9811223344", batch: "Kathak Classical (Weekend 10:00 AM - 11:30 AM)", attendance_date: TODAY, status: "Absent", note: "Viral Fever (Informed studio)" },
    { id: "ATT-107", student_id: "TN-2026-007", student_name: "Vikram Malhotra", phone: "9933445566", batch: "Morning Zumba & Dance Fitness (Mon-Fri 7:00 AM - 8:00 AM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-108", student_id: "TN-2026-008", student_name: "Neha Kulkarni", phone: "9845012345", batch: "Bollywood Commercial (MWF 6:00 PM - 7:00 PM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-109", student_id: "TN-2026-009", student_name: "Siddharth Rao", phone: "9731234567", batch: "Kids Dance Foundations (MWF 5:00 PM - 6:00 PM)", attendance_date: TODAY, status: "Present", note: "" },
    { id: "ATT-110", student_id: "TN-2026-010", student_name: "Tanvi Deshmukh", phone: "9820011223", batch: "Contemporary & Movement (Sat/Sun 4:00 PM - 5:30 PM)", attendance_date: TODAY, status: "Leave", note: "Approved Leave - Family Function" }
  ];

  function getTable(table) {
    const key = 'tn_demo_db_' + table;
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (table === 'students') {
        localStorage.setItem(key, JSON.stringify(INITIAL_STUDENTS));
        return JSON.parse(JSON.stringify(INITIAL_STUDENTS));
      }
      if (table === 'payments') {
        localStorage.setItem(key, JSON.stringify(INITIAL_PAYMENTS));
        return JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
      }
      if (table === 'attendance') {
        localStorage.setItem(key, JSON.stringify(INITIAL_ATTENDANCE));
        return JSON.parse(JSON.stringify(INITIAL_ATTENDANCE));
      }
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (table === 'students' && (!parsed || parsed.length === 0)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_STUDENTS));
        return JSON.parse(JSON.stringify(INITIAL_STUDENTS));
      }
      return parsed || [];
    } catch (e) {
      return [];
    }
  }

  function setTable(table, data) {
    localStorage.setItem('tn_demo_db_' + table, JSON.stringify(data));
  }

  function createNartanClient() {
    return {
      from: function(table) {
        return {
          select: function(cols) {
            let rows = getTable(table);
            let filters = [];
            let sortField = null;
            let sortAsc = true;
            let limitCount = null;

            const queryObj = {
              order: function(col, opt) {
                sortField = col;
                sortAsc = opt ? (opt.ascending !== false) : true;
                return queryObj;
              },
              eq: function(field, val) {
                filters.push(function(r) {
                  return String(r[field] || '') === String(val || '');
                });
                return queryObj;
              },
              limit: function(n) {
                limitCount = n;
                return queryObj;
              },
              maybeSingle: async function() {
                let res = rows.filter(function(r) { return filters.every(function(f) { return f(r); }); });
                return { data: res[0] || null, error: null };
              },
              single: async function() {
                let res = rows.filter(function(r) { return filters.every(function(f) { return f(r); }); });
                return { data: res[0] || null, error: null };
              },
              then: function(resolve) {
                let res = rows.filter(function(r) { return filters.every(function(f) { return f(r); }); });
                if (sortField) {
                  res.sort(function(a, b) {
                    let va = a[sortField] || '';
                    let vb = b[sortField] || '';
                    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
                  });
                }
                if (limitCount != null) res = res.slice(0, limitCount);
                resolve({ data: res, error: null });
              }
            };
            return queryObj;
          },
          insert: function(records) {
            let rows = getTable(table);
            let inserted = (records || []).map(function(r) {
              return Object.assign({
                id: r.id || ('TN-' + Math.floor(1000 + Math.random() * 9000)),
                created_at: r.created_at || new Date().toISOString()
              }, r);
            });
            rows = inserted.concat(rows);
            setTable(table, rows);
            const chain = {
              select: function() { return Promise.resolve({ data: inserted, error: null }); },
              then: function(resolve) { resolve({ data: inserted, error: null }); }
            };
            return chain;
          },
          update: function(updates) {
            let filters = [];
            const updateObj = {
              eq: function(field, val) {
                filters.push(function(r) { return String(r[field] || '') === String(val || ''); });
                return updateObj;
              },
              then: function(resolve) {
                let rows = getTable(table);
                let updated = [];
                rows = rows.map(function(r) {
                  if (filters.every(function(f) { return f(r); })) {
                    let nr = Object.assign({}, r, updates);
                    updated.push(nr);
                    return nr;
                  }
                  return r;
                });
                setTable(table, rows);
                resolve({ data: updated, error: null });
              }
            };
            return updateObj;
          },
          delete: function() {
            let filters = [];
            const delObj = {
              eq: function(field, val) {
                filters.push(function(r) { return String(r[field] || '') === String(val || ''); });
                return delObj;
              },
              then: function(resolve) {
                let rows = getTable(table);
                rows = rows.filter(function(r) { return !filters.every(function(f) { return f(r); }); });
                setTable(table, rows);
                resolve({ data: null, error: null });
              }
            };
            return delObj;
          }
        };
      },
      channel: function() {
        return {
          on: function() { return this; },
          subscribe: function() { return this; }
        };
      }
    };
  }

  window.createNartanClient = createNartanClient;

  // Intercept window.supabase globally to guarantee zero network calls to external DBs
  function interceptSupabase() {
    if (!window.supabase) window.supabase = {};
    window.supabase.createClient = function(url, key) {
      console.log('[Team Nartan] Isolated database active — zero external database calls.');
      return createNartanClient();
    };
  }

  interceptSupabase();
  window.addEventListener('DOMContentLoaded', interceptSupabase);
})();
