/**
 * Team Nartan Isolated Client-Side Database
 * 
 * 100% Isolated: Completely intercepts and replaces external Supabase connections
 * so NO client data from Creative Edge is ever requested, fetched, or exposed.
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

  const INITIAL_STUDENTS = [
    {
      id: "TN-2026-001",
      name: "Aarav Sharma",
      phone: "9876543210",
      category: "Adults",
      batch: "Kathak Classical (Weekend)",
      dance_style: "Kathak",
      fee_plan: "3 Months",
      fee_amount: 6000,
      monthly_fee: 6000,
      fee_status: "paid",
      due_date: "2026-10-15",
      next_due_date: "2026-10-15",
      enrolled_date: "2026-01-15",
      admission_date: "2026-01-15",
      created_at: "2026-01-15T10:00:00.000Z",
      status: "Active",
      notes: "Demo Student - Team Nartan Elite Batch"
    },
    {
      id: "TN-2026-002",
      name: "Ananya Roy",
      phone: "9123456789",
      category: "Adults",
      batch: "Bollywood Commercial (MWF)",
      dance_style: "Bollywood",
      fee_plan: "1 Month",
      fee_amount: 1800,
      monthly_fee: 1800,
      fee_status: "paid",
      due_date: "2026-10-20",
      next_due_date: "2026-10-20",
      enrolled_date: "2026-02-10",
      admission_date: "2026-02-10",
      created_at: "2026-02-10T11:00:00.000Z",
      status: "Active",
      notes: "Demo Student - Team Nartan Commercial"
    },
    {
      id: "TN-2026-003",
      name: "Rohan Verma",
      phone: "9988776655",
      category: "Adults",
      batch: "Urban Hip-Hop & Popping (TTS)",
      dance_style: "Hip-Hop",
      fee_plan: "3 Months",
      fee_amount: 5500,
      monthly_fee: 5500,
      fee_status: "paid",
      due_date: "2026-11-05",
      next_due_date: "2026-11-05",
      enrolled_date: "2026-03-01",
      admission_date: "2026-03-01",
      created_at: "2026-03-01T09:00:00.000Z",
      status: "Active",
      notes: "Demo Student - Hip-Hop Crew"
    },
    {
      id: "TN-2026-004",
      name: "Meera Nair",
      phone: "9811223344",
      category: "Adults",
      batch: "Contemporary & Movement (Weekend)",
      dance_style: "Contemporary",
      fee_plan: "3 Months",
      fee_amount: 6500,
      monthly_fee: 6500,
      fee_status: "paid",
      due_date: "2026-10-30",
      next_due_date: "2026-10-30",
      enrolled_date: "2026-03-15",
      admission_date: "2026-03-15",
      created_at: "2026-03-15T09:00:00.000Z",
      status: "Active",
      notes: "Demo Student - Contemporary Workshop"
    }
  ];

  function getTable(table) {
    const key = 'tn_demo_db_' + table;
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (table === 'students') {
        localStorage.setItem(key, JSON.stringify(INITIAL_STUDENTS));
        return JSON.parse(JSON.stringify(INITIAL_STUDENTS));
      }
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      // Ensure default students exist if table was initialized empty
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

  // Intercept window.supabase to prevent any third-party or residual script
  // from querying external production databases
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
