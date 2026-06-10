// ─── Google Sheets Storage Layer ─────────────────────────────────────────────
// Falls back to localStorage if Sheets credentials are not configured.
// Sheet structure:
//   Tab "assessments" : one row per RA (22 scalar fields, cols A–V)
//   Tab "hazards"     : one row per hazard (linked by assessment id)
//   Tab "staff"       : staff directory
//   Tab "settings"    : key/value app settings
//   Tab "audit_log"   : append-only change log

const SHEET_ID       = import.meta.env.VITE_SHEET_ID        || '';
const API_KEY        = import.meta.env.VITE_SHEETS_API_KEY  || '';
const SHEETS_ENABLED = !!(SHEET_ID && API_KEY);

// ── Low-level Sheets read ─────────────────────────────────────────────────────
async function sheetsRead(range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets read failed: ${res.status}`);
  const data = await res.json();
  return data.values || [];
}

// Sheets write requires OAuth — we use a Cloudflare Worker proxy (see SETUP.md)
// operation: 'append' (default) | 'update' (PUT to specific range) | 'clear' (wipe range)
async function sheetsWrite(range, values, operation = 'append') {
  const workerUrl = import.meta.env.VITE_WORKER_URL;
  if (!workerUrl) throw new Error('VITE_WORKER_URL not set — writes unavailable');
  // Use text/plain to avoid CORS preflight (simple request — no OPTIONS needed).
  // The Worker parses the body as JSON regardless of content-type.
  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ range, values, operation }),
  });
  if (!res.ok) throw new Error(`Sheets write failed: ${res.status}`);
  return res.json();
}

// ── Row <-> Object mapping ────────────────────────────────────────────────────
// 22 columns A–V. approvedBy sits at col R (between reviewDate and pccNoted).
const RA_COLS = [
  'id','ref','name','category','location','legislation','reviewMonths',
  'whoAtRisk','involvesChildren','involvesVulnerableAdults','involvesFood',
  'isOutdoor','status','version','assessedBy','assessedDate','reviewDate',
  'approvedBy','pccNoted','vicarSignoff','createdAt','updatedAt',
];

const HAZARD_COLS = [
  'id','assessmentId','hazard','who','existingControls',
  'likelihood','severity','additionalControls','owner','deadline','sortOrder',
];

const STAFF_COLS   = ['key','label','name','email','phone'];

function rowToRA(row) {
  const obj = {};
  RA_COLS.forEach((col, i) => { obj[col] = row[i] ?? ''; });
  obj.whoAtRisk                = obj.whoAtRisk ? obj.whoAtRisk.split('|') : [];
  obj.involvesChildren         = obj.involvesChildren === 'true';
  obj.involvesVulnerableAdults = obj.involvesVulnerableAdults === 'true';
  obj.involvesFood             = obj.involvesFood === 'true';
  obj.isOutdoor                = obj.isOutdoor === 'true';
  obj.reviewMonths             = Number(obj.reviewMonths) || 12;
  obj.version                  = Number(obj.version) || 1;
  return obj;
}

function raToRow(ra) {
  return RA_COLS.map(col => {
    const v = ra[col];
    if (Array.isArray(v)) return v.join('|');
    if (typeof v === 'boolean') return String(v);
    return v ?? '';
  });
}

function rowToHazard(row) {
  const obj = {};
  HAZARD_COLS.forEach((col, i) => { obj[col] = row[i] ?? ''; });
  obj.likelihood = Number(obj.likelihood) || 2;
  obj.severity   = Number(obj.severity)   || 2;
  obj.sortOrder  = Number(obj.sortOrder)  || 0;
  return obj;
}

function hazardToRow(h) {
  return HAZARD_COLS.map(col => {
    const v = h[col];
    return (v === null || v === undefined) ? '' : String(v);
  });
}

function staffToRow(s) {
  return STAFF_COLS.map(col => s[col] ?? '');
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function loadAll() {
  if (!SHEETS_ENABLED) return loadFromLocal();

  try {
    const [raRows, hazardRows, staffRows, settingRows] = await Promise.all([
      sheetsRead('assessments!A2:V'),   // 22 cols A–V
      sheetsRead('hazards!A2:K'),
      sheetsRead('staff!A2:E'),
      sheetsRead('settings!A2:B'),
    ]);

    const assessments = raRows.map(rowToRA);
    const hazardObjs  = hazardRows.map(rowToHazard);

    // Attach hazards to their parent assessment
    assessments.forEach(ra => {
      ra.hazards = hazardObjs
        .filter(h => h.assessmentId === ra.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    });

    const staff    = staffRows.map(row => {
      const obj = {};
      STAFF_COLS.forEach((col, i) => { obj[col] = row[i] ?? ''; });
      return obj;
    });
    const settings = Object.fromEntries(settingRows.map(([k, v]) => [k, v]));

    return { assessments, staff, settings };
  } catch (err) {
    console.warn('Sheets load failed, falling back to localStorage:', err);
    return loadFromLocal();
  }
}

export async function saveAssessment(ra, allAssessments) {
  // Always persist to localStorage as cache / offline fallback
  saveToLocal({ assessments: allAssessments });

  if (!SHEETS_ENABLED) return;

  try {
    // ── Upsert the RA row ──────────────────────────────────────────────────
    const existing = await sheetsRead('assessments!A:A');
    const rowIdx   = existing.findIndex(r => r[0] === ra?.id);

    if (rowIdx >= 0) {
      // Row already exists — overwrite in place
      await sheetsWrite(`assessments!A${rowIdx + 2}:V${rowIdx + 2}`, [raToRow(ra)], 'update');
    } else if (ra) {
      // New assessment — append a row
      await sheetsWrite('assessments!A:V', [raToRow(ra)], 'append');
    }

    // ── Full hazard sync for this assessment ──────────────────────────────
    // Read all hazard rows, swap out this assessment's hazards, rewrite the tab.
    const allHazardRows = await sheetsRead('hazards!A2:K');
    const otherHazards  = allHazardRows.filter(r => r[1] !== ra?.id);

    const newHazardRows = (ra?.hazards || []).map((h, i) => hazardToRow({
      ...h,
      id:           `${ra.id}_h${i}`,
      assessmentId: ra.id,
      sortOrder:    i,
    }));

    const allRows = [...otherHazards, ...newHazardRows];

    // Clear data rows then write the full merged set
    await sheetsWrite('hazards!A2:K', [], 'clear');
    if (allRows.length > 0) {
      await sheetsWrite('hazards!A2:K', allRows, 'update');
    }

    await appendAuditLog(`Updated assessment: ${ra?.ref} — ${ra?.name}`);
  } catch (err) {
    console.error('Sheets save failed:', err);
  }
}

export async function saveStaff(staff) {
  const ls = getLocal();
  ls.staff = staff;
  setLocal(ls);

  if (!SHEETS_ENABLED) return;
  try {
    // Clear first so removed staff members don't survive as trailing rows.
    await sheetsWrite('staff!A2:E', [], 'clear');
    if (staff.length > 0) {
      await sheetsWrite('staff!A2:E', staff.map(staffToRow), 'update');
    }
    await appendAuditLog('Updated staff directory');
  } catch (err) {
    console.error('Sheets staff save failed:', err);
  }
}

export async function saveSettings(settings) {
  const ls = getLocal();
  ls.settings = settings;
  setLocal(ls);

  if (!SHEETS_ENABLED) return;
  try {
    const rows = Object.entries(settings).map(([k, v]) => [k, v]);
    // Clear first so removed setting keys don't survive as trailing rows.
    await sheetsWrite('settings!A2:B', [], 'clear');
    if (rows.length > 0) {
      await sheetsWrite('settings!A2:B', rows, 'update');
    }
    await appendAuditLog('Updated settings');
  } catch (err) {
    console.error('Sheets settings save failed:', err);
  }
}

// Delete an assessment and its hazards from Sheets. The previous implementation
// (calling saveAssessment(null, ...)) silently no-op'd on the sheet — see PLANS.md
// bug 0.2. We rewrite both tabs from the remaining state.
export async function deleteAssessment(id, remainingAssessments) {
  saveToLocal({ assessments: remainingAssessments });

  if (!SHEETS_ENABLED) return;

  try {
    const raRows = remainingAssessments.map(raToRow);
    const hazardRows = remainingAssessments.flatMap((ra) =>
      (ra.hazards || []).map((h, i) => hazardToRow({
        ...h,
        id:           `${ra.id}_h${i}`,
        assessmentId: ra.id,
        sortOrder:    i,
      }))
    );

    await sheetsWrite('assessments!A2:V', [], 'clear');
    if (raRows.length > 0) {
      await sheetsWrite('assessments!A2:V', raRows, 'update');
    }

    await sheetsWrite('hazards!A2:K', [], 'clear');
    if (hazardRows.length > 0) {
      await sheetsWrite('hazards!A2:K', hazardRows, 'update');
    }

    await appendAuditLog(`Deleted assessment: ${id}`);
  } catch (err) {
    console.error('Sheets delete failed:', err);
  }
}

// Bulk-persist all assessments to localStorage.
// Used by auto-status update on load and by the import-from-backup feature.
// Does NOT write to Sheets — callers handle that via saveAssessment if needed.
export function patchLocalAssessments(assessments) {
  saveToLocal({ assessments });
}

// One-time migration: write all assessments and their hazards to Sheets.
// Only call when the sheet is empty and localStorage has existing data.
export async function syncToSheets(assessments) {
  if (!SHEETS_ENABLED) throw new Error('Sheets not configured — check GitHub Secrets.');

  const raRows = assessments.map(raToRow);
  const hazardRows = assessments.flatMap((ra, raIdx) =>
    (ra.hazards || []).map((h, i) => hazardToRow({
      ...h,
      id:           `${ra.id}_h${i}`,
      assessmentId: ra.id,
      sortOrder:    i,
    }))
  );

  // Clear existing data rows then write all at once
  await sheetsWrite('assessments!A2:V', [], 'clear');
  if (raRows.length > 0) {
    await sheetsWrite('assessments!A2:V', raRows, 'update');
  }

  await sheetsWrite('hazards!A2:K', [], 'clear');
  if (hazardRows.length > 0) {
    await sheetsWrite('hazards!A2:K', hazardRows, 'update');
  }

  await appendAuditLog(`Migrated ${assessments.length} assessments from localStorage to Sheets`);
}

async function appendAuditLog(message) {
  if (!SHEETS_ENABLED) return;
  const row = [new Date().toISOString(), message, navigator.userAgent.slice(0, 60)];
  try { await sheetsWrite('audit_log!A:C', [row], 'append'); } catch (_) {}
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = 'sfm_ra_v2';

function getLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function setLocal(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_) {}
}

function saveToLocal(data) {
  const existing = getLocal();
  setLocal({ ...existing, ...data });
}

function loadFromLocal() {
  const data = getLocal();
  return {
    assessments: data.assessments || null, // null = seed from templates on first run
    staff:       data.staff       || DEFAULT_STAFF,
    settings:    data.settings    || DEFAULT_SETTINGS,
  };
}

// ── Defaults ──────────────────────────────────────────────────────────────────
export const DEFAULT_STAFF = [
  { key: 'vicar',          label: 'Vicar',                      name: 'TBC',            email: '', phone: '' },
  { key: 'ops_manager',    label: 'Operations Manager',         name: 'James Duffield', email: '', phone: '' },
  { key: 'pso',            label: 'Parish Safeguarding Officer',name: 'Joanne Baillie', email: '', phone: '' },
  { key: 'cf_pastor',      label: 'Children & Families Pastor', name: 'TBC',            email: '', phone: '' },
  { key: 'youth_pastor',   label: 'Youth Pastor',               name: 'TBC',            email: '', phone: '' },
  { key: 'churchwarden_1', label: 'Churchwarden',               name: 'TBC',            email: '', phone: '' },
  { key: 'churchwarden_2', label: 'Churchwarden',               name: 'TBC',            email: '', phone: '' },
  { key: 'first_aider',    label: 'First Aider (Primary)',      name: 'TBC',            email: '', phone: '' },
  { key: 'fire_marshal',   label: 'Fire Marshal',               name: 'TBC',            email: '', phone: '' },
];

export const DEFAULT_SETTINGS = {
  church_name:           'St Francis Mackworth',
  address:               'Mackworth, Derby, DE22 4FN',
  diocese:               'Diocese of Derby',
  network:               'HTB Network',
  registered_charity:    '',
  ecclesiastical_policy: '',
  admin_email:           '',
  website:               '',
};
