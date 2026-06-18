import { useState, useMemo, useEffect } from 'react';
import { getRiskLevel, RISK_LEVELS, WHO_AT_RISK_OPTIONS, HAZARD_BANK, CATEGORY_COLORS } from '../data/riskData';
import { LIBRARY_CATEGORIES, getAllLibraryEntries, loadCustomLibrary, saveCustomLibrary, refreshCustomLibrary } from '../data/hazardLibrary';

const css = {
  input:    { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E4DDD2', fontSize: 13, color: '#1C1C1A', background: '#FEFEFC', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E4DDD2', fontSize: 13, color: '#1C1C1A', background: '#FEFEFC', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit' },
  select:   { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E4DDD2', fontSize: 13, color: '#1C1C1A', background: '#FEFEFC', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  btn:      (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  label:    { display: 'block', fontSize: 11, fontWeight: 700, color: '#8C887E', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' },
};

function Field({ label, children, note }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={css.label}>{label}</label>
      {children}
      {note && <p style={{ fontSize: 11, color: '#C8C2B8', margin: '3px 0 0' }}>{note}</p>}
    </div>
  );
}

function RiskBadge({ likelihood, severity }) {
  const r = getRiskLevel(likelihood, severity);
  return (
    <span style={{ display: 'inline-block', background: r.bg, color: r.color, border: `1px solid ${r.border}`, borderRadius: 4, padding: '2px 10px', fontSize: 11, fontWeight: 700, minWidth: 72, textAlign: 'center' }}>
      {r.score} — {r.label}
    </span>
  );
}

export default function RAEditor({ ra, staff, isAdmin, saving, onSave, onPreview, onBack }) {
  const [local, setLocal] = useState({ ...ra, hazards: (ra.hazards || []).map(h => ({ ...h })) });
  const [bankOpen, setBankOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libCat, setLibCat] = useState('All');
  const [libSearch, setLibSearch] = useState('');
  const [customEntries, setCustomEntries] = useState(() => loadCustomLibrary());
  const [saveToLibIdx, setSaveToLibIdx] = useState(null);
  const [saveToLibCat, setSaveToLibCat] = useState(LIBRARY_CATEGORIES.find(c => c !== 'All') || 'Slips, Trips & Falls');

  // Sync custom library from Sheets on mount (localStorage shows instantly).
  useEffect(() => {
    refreshCustomLibrary().then(remote => { if (remote) setCustomEntries(remote); });
  }, []);
  const [dirty, setDirty] = useState(false);

  const update = (field, value) => { setLocal(l => ({ ...l, [field]: value })); setDirty(true); };

  const updateHazard = (idx, field, value) => {
    setLocal(l => {
      const hazards = l.hazards.map((h, i) => i === idx ? { ...h, [field]: value } : h);
      return { ...l, hazards };
    });
    setDirty(true);
  };

  const addHazard = () => {
    update('hazards', [...(local.hazards || []), { hazard: '', who: '', existingControls: '', likelihood: 2, severity: 2, additionalControls: '', owner: '', deadline: '' }]);
  };

  const removeHazard = (idx) => update('hazards', local.hazards.filter((_, i) => i !== idx));

  const saveHazardToLibrary = (idx) => {
    const hz = local.hazards[idx];
    if (!hz || !hz.hazard) return;
    const entry = {
      id: 'custom_' + Date.now(),
      category: saveToLibCat,
      hazard: hz.hazard,
      who: hz.who || '',
      existingControls: hz.existingControls || '',
      likelihood: hz.likelihood || 2,
      severity: hz.severity || 2,
      additionalControls: hz.additionalControls || '',
    };
    const next = [...customEntries, entry];
    setCustomEntries(next);
    saveCustomLibrary(next);
    setSaveToLibIdx(null);
  };

  const addFromBank = (text) => {
    update('hazards', [...(local.hazards || []), { hazard: text, who: '', existingControls: '', likelihood: 2, severity: 2, additionalControls: '', owner: '', deadline: '' }]);
    setBankOpen(false);
  };

  const addFromLibrary = (entry) => {
    update('hazards', [...(local.hazards || []), {
      hazard: entry.hazard, who: entry.who,
      existingControls: entry.existingControls,
      likelihood: entry.likelihood, severity: entry.severity,
      additionalControls: entry.additionalControls || '',
      owner: '', deadline: '',
    }]);
    setLibraryOpen(false);
  };

  const allLibraryEntries = useMemo(() => [...getAllLibraryEntries(), ...customEntries.filter(c => !getAllLibraryEntries().find(b => b.id === c.id))], [customEntries]);

  const filteredLibrary = useMemo(() => allLibraryEntries.filter(e => {
    if (libCat !== 'All' && e.category !== libCat) return false;
    if (libSearch) {
      const q = libSearch.toLowerCase();
      return e.hazard.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.who.toLowerCase().includes(q);
    }
    return true;
  }), [allLibraryEntries, libCat, libSearch]);

  const moveHazard = (idx, dir) => {
    const arr = [...local.hazards];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    update('hazards', arr);
  };

  // Staff name suggestions for owner fields
  const staffNames = (staff || []).map(s => s.name).filter(n => n && n !== 'TBC');

  const riskSummary = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  (local.hazards || []).forEach(h => { riskSummary[getRiskLevel(h.likelihood, h.severity).label]++; });

  return (
    <div>
      {/* Sticky toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'sticky', top: 60, zIndex: 50, background: '#F5F2EB', padding: '12px 0', borderBottom: '1px solid #E4DDD2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={css.btn('#F5F2EB', '#5C5852')}>← Back</button>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: '#1C1C1A', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.01em' }}>
            {local.ref ? `${local.ref} — ` : ''}{local.name || 'New Assessment'}
          </h2>
          {dirty && <span style={{ fontSize: 12, color: '#8B5B18', fontWeight: 600 }}>Unsaved changes</span>}
          {saving && <span style={{ fontSize: 12, color: '#8C887E' }}>Saving…</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onPreview(local)} style={css.btn('#F5F2EB', '#1A3D2B')}>Preview</button>
          <button onClick={() => { onSave(local); setDirty(false); }} style={css.btn('#1A3D2B', '#fff')}>Save</button>
        </div>
      </div>

      <div className="editor-layout">
        {/* Main */}
        <div>
          {/* Assessment details */}
          <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C887E' }}>Assessment Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12 }}>
              <Field label="Ref"><input value={local.ref || ''} onChange={e => update('ref', e.target.value)} style={css.input} placeholder="P1" /></Field>
              <Field label="Title"><input value={local.name || ''} onChange={e => update('name', e.target.value)} style={css.input} /></Field>
              <Field label="Category">
                <select value={local.category || ''} onChange={e => update('category', e.target.value)} style={css.select}>
                  <option value="">Select…</option>
                  {['Premises','Regular Activities','Events','Maintenance','Operations','Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Location / Area"><input value={local.location || ''} onChange={e => update('location', e.target.value)} style={css.input} /></Field>
            <Field label="Legislation"><input value={local.legislation || ''} onChange={e => update('legislation', e.target.value)} style={css.input} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Assessed By"><input value={local.assessedBy || ''} onChange={e => update('assessedBy', e.target.value)} style={css.input} list="staff-names" /><datalist id="staff-names">{staffNames.map(n => <option key={n} value={n} />)}</datalist></Field>
              <Field label="Date Assessed"><input type="date" value={local.assessedDate || ''} onChange={e => update('assessedDate', e.target.value)} style={css.input} /></Field>
              <Field label="Review Date"><input type="date" value={local.reviewDate || ''} onChange={e => update('reviewDate', e.target.value)} style={css.input} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <Field label="Status">
                <select value={local.status || 'draft'} onChange={e => update('status', e.target.value)} style={css.select}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field label="Approved By" note="Vicar or Operations Manager">
                <input value={local.approvedBy || ''} onChange={e => update('approvedBy', e.target.value)} style={css.input} list="staff-names-approver" placeholder="Name" />
                <datalist id="staff-names-approver">{staffNames.map(n => <option key={n} value={n} />)}</datalist>
              </Field>
              <Field label="PCC Noted (Date)"><input type="date" value={local.pccNoted || ''} onChange={e => update('pccNoted', e.target.value)} style={css.input} /></Field>
              <Field label="Vicar Sign-Off"><input value={local.vicarSignoff || ''} onChange={e => update('vicarSignoff', e.target.value)} style={css.input} placeholder="Name + date" /></Field>
            </div>
            <Field label="Who Might Be Harmed">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {WHO_AT_RISK_OPTIONS.map(opt => {
                  const sel = (local.whoAtRisk || []).includes(opt);
                  return (
                    <button key={opt} onClick={() => {
                      const cur = local.whoAtRisk || [];
                      update('whoAtRisk', sel ? cur.filter(x => x !== opt) : [...cur, opt]);
                    }} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid', borderColor: sel ? '#1A3D2B' : '#E4DDD2', background: sel ? '#1A3D2B' : '#F5F2EB', color: sel ? '#fff' : '#5C5852', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{opt}</button>
                  );
                })}
              </div>
            </Field>
          </div>

          {/* Hazards */}
          <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C887E' }}>
                Hazards & Controls ({(local.hazards || []).length})
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setLibraryOpen(true); setLibCat('All'); setLibSearch(''); }} style={css.btn('#9A6B1E', '#fff')}>📚 Hazard library</button>
                <button onClick={() => setBankOpen(b => !b)} style={css.btn('#F5F2EB', '#5C5852')}>{bankOpen ? '▲ Hide bank' : '▼ Quick add'}</button>
                <button onClick={addHazard} style={css.btn('#1A3D2B', '#fff')}>+ Blank hazard</button>
              </div>
            </div>

            {/* Hazard bank */}
            {bankOpen && (
              <div style={{ background: '#F5F2EB', border: '1px solid #E4DDD2', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#8C887E', margin: '0 0 10px', fontWeight: 600 }}>Click to add:</p>
                {Object.entries(HAZARD_BANK).map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5C5852', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {items.map(h => (
                        <button key={h} onClick={() => addFromBank(h)} style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#2A2A28', fontFamily: 'inherit' }}>{h}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hazard rows */}
            {(local.hazards || []).map((hz, idx) => {
              const r = getRiskLevel(hz.likelihood, hz.severity);
              return (
                <div key={idx} style={{ border: `1px solid ${r.border}`, borderLeft: `4px solid ${r.color}`, borderRadius: 8, padding: 14, marginBottom: 12, background: r.bg + '33' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#8C887E' }}>#{idx + 1}</span>
                      <button onClick={() => moveHazard(idx, -1)} disabled={idx === 0} style={{ background: '#F5F2EB', border: 'none', borderRadius: 4, cursor: idx === 0 ? 'default' : 'pointer', padding: '2px 7px', fontSize: 12, opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                      <button onClick={() => moveHazard(idx, 1)} disabled={idx === local.hazards.length - 1} style={{ background: '#F5F2EB', border: 'none', borderRadius: 4, cursor: idx === local.hazards.length - 1 ? 'default' : 'pointer', padding: '2px 7px', fontSize: 12, opacity: idx === local.hazards.length - 1 ? 0.4 : 1 }}>↓</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <RiskBadge likelihood={hz.likelihood} severity={hz.severity} />
                      {isAdmin && saveToLibIdx !== idx && hz.hazard && (
                        <button onClick={() => setSaveToLibIdx(idx)} title="Save this hazard to the library"
                          style={{ background: '#FDF5E4', color: '#9A6B1E', border: '1px solid #E0CFB0', borderRadius: 4, cursor: 'pointer', padding: '3px 9px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                          📚 + Library
                        </button>
                      )}
                      {isAdmin && saveToLibIdx === idx && (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: '#FDF5E4', border: '1px solid #E0CFB0', borderRadius: 6, padding: '3px 6px' }}>
                          <select value={saveToLibCat} onChange={e => setSaveToLibCat(e.target.value)}
                            style={{ fontSize: 11, border: '1px solid #E0CFB0', borderRadius: 4, padding: '2px 6px', fontFamily: 'inherit', background: '#FEFEFC', color: '#1C1C1A' }}>
                            {LIBRARY_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button onClick={() => saveHazardToLibrary(idx)}
                            style={{ background: '#9A6B1E', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                          <button onClick={() => setSaveToLibIdx(null)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8C887E', fontSize: 13, padding: '0 2px' }}>✕</button>
                        </div>
                      )}
                      <button onClick={() => removeHazard(idx)} style={{ background: '#FAF0F1', border: 'none', borderRadius: 4, color: '#8B2430', cursor: 'pointer', padding: '3px 8px', fontSize: 12 }}>✕</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <Field label="Hazard Description"><input value={hz.hazard || ''} onChange={e => updateHazard(idx, 'hazard', e.target.value)} style={css.input} /></Field>
                    <Field label="Who is at Risk"><input value={hz.who || ''} onChange={e => updateHazard(idx, 'who', e.target.value)} style={css.input} /></Field>
                  </div>

                  <Field label="Existing Controls"><textarea value={hz.existingControls || ''} onChange={e => updateHazard(idx, 'existingControls', e.target.value)} style={css.textarea} /></Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <Field label="Likelihood" note="1=Unlikely 2=Possible 3=Likely">
                      <select value={hz.likelihood} onChange={e => updateHazard(idx, 'likelihood', Number(e.target.value))} style={css.select}>
                        <option value={1}>1 — Unlikely</option><option value={2}>2 — Possible</option><option value={3}>3 — Likely</option>
                      </select>
                    </Field>
                    <Field label="Severity" note="1=Minor 2=Significant 3=Major">
                      <select value={hz.severity} onChange={e => updateHazard(idx, 'severity', Number(e.target.value))} style={css.select}>
                        <option value={1}>1 — Minor</option><option value={2}>2 — Significant</option><option value={3}>3 — Major/Fatal</option>
                      </select>
                    </Field>
                    <Field label="Risk Score">
                      <div style={{ padding: '8px 10px', borderRadius: 6, border: `1px solid ${r.border}`, background: r.bg, fontWeight: 700, color: r.color, fontSize: 13, textAlign: 'center' }}>
                        {hz.likelihood * hz.severity} — {r.label}
                      </div>
                    </Field>
                    <Field label="Owner">
                      <input value={hz.owner || ''} onChange={e => updateHazard(idx, 'owner', e.target.value)} style={css.input} list="staff-names-hz" />
                      <datalist id="staff-names-hz">{staffNames.map(n => <option key={n} value={n} />)}</datalist>
                    </Field>
                    <Field label="Deadline"><input type="date" value={hz.deadline || ''} onChange={e => updateHazard(idx, 'deadline', e.target.value)} style={css.input} /></Field>
                  </div>

                  <Field label="Additional Controls Required">
                    <textarea value={hz.additionalControls || ''} onChange={e => updateHazard(idx, 'additionalControls', e.target.value)} style={{ ...css.textarea, minHeight: 44 }} placeholder="Leave blank if none required" />
                  </Field>
                </div>
              );
            })}

            {!(local.hazards || []).length && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#C8C2B8' }}>
                No hazards yet.
                <br /><br />
                <button onClick={() => { setLibraryOpen(true); setLibCat('All'); setLibSearch(''); }} style={{ background: '#9A6B1E', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📚 Open hazard library</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="editor-sidebar">
          {/* Flags */}
          <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 10, padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C887E' }}>Activity Flags</h3>
            {[
              ['involvesChildren',       'Involves children',        "Apply children's ratios, DBS, safeguarding"],
              ['involvesVulnerableAdults','Involves vulnerable adults','Apply safeguarding + medical controls'],
              ['involvesFood',           'Involves food',             "Apply Natasha's Law, allergen, hygiene controls"],
              ['isOutdoor',              'Outdoor / off-site',        'Apply weather, transport, outdoor controls'],
            ].map(([field, label, note]) => (
              <div key={field} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div onClick={() => update(field, !local[field])} style={{ width: 36, height: 20, borderRadius: 10, background: local[field] ? '#1A3D2B' : '#E4DDD2', cursor: 'pointer', position: 'relative', flexShrink: 0, marginTop: 2 }}>
                  <div style={{ position: 'absolute', top: 2, left: local[field] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#FEFEFC', transition: 'left 0.15s' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#C8C2B8', marginTop: 1 }}>{note}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Risk summary */}
          <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 10, padding: 18 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C887E' }}>Risk Summary</h3>
            {Object.entries(RISK_LEVELS).map(([level, { color, bg, border }]) => (
              <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{level}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: riskSummary[level] > 0 ? color : '#C8C2B8' }}>{riskSummary[level]}</span>
              </div>
            ))}
          </div>

          {/* References */}
          <div style={{ background: '#F5F2EB', border: '1px solid #E4DDD2', borderRadius: 10, padding: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C887E' }}>References</h3>
            <p style={{ fontSize: 12, color: '#5C5852', margin: '0 0 5px' }}><strong>Ecclesiastical:</strong> 0345 600 7531</p>
            <p style={{ fontSize: 12, color: '#5C5852', margin: '0 0 5px' }}><strong>RIDDOR:</strong> hse.gov.uk/riddor</p>
            <p style={{ fontSize: 12, color: '#5C5852', margin: 0 }}><strong>HSE guidance:</strong> hse.gov.uk/risk</p>
          </div>
        </div>
      </div>

      {/* ── Hazard Library Modal ─────────────────────────────────────────── */}
      {libraryOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px', overflowY: 'auto' }}>
          <div style={{ background: '#FEFEFC', borderRadius: 14, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #E4DDD2', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: '#1C1C1A', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.01em' }}>📚 Hazard Library</h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#8C887E' }}>Click any entry to add it as a pre-filled hazard row. All fields remain editable.</p>
                </div>
                <button onClick={() => setLibraryOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8C887E', lineHeight: 1 }}>✕</button>
              </div>
              {/* Search */}
              <input
                value={libSearch} onChange={e => setLibSearch(e.target.value)}
                placeholder="Search hazards…"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #E4DDD2', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
              />
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {LIBRARY_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setLibCat(c)} style={{
                    padding: '4px 11px', borderRadius: 5, border: '1px solid',
                    borderColor: libCat === c ? '#9A6B1E' : '#E4DDD2',
                    background: libCat === c ? '#9A6B1E' : '#fff',
                    color: libCat === c ? '#fff' : '#5C5852',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Entry list */}
            <div style={{ overflowY: 'auto', padding: '12px 16px', flex: 1 }}>
              {filteredLibrary.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#C8C2B8', fontSize: 14 }}>No hazards match your search.</div>
              )}
              {filteredLibrary.map(entry => {
                const r = getRiskLevel(entry.likelihood, entry.severity);
                const isCustom = entry.id.startsWith('custom_');
                return (
                  <div key={entry.id} onClick={() => addFromLibrary(entry)}
                    style={{ border: `1px solid ${r.border}`, borderLeft: `4px solid ${r.color}`, borderRadius: 8, padding: '11px 14px', marginBottom: 8, cursor: 'pointer', background: '#FEFEFC', transition: 'box-shadow 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', flex: 1 }}>{entry.hazard}</div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {isCustom && <span style={{ fontSize: 10, background: '#FDF5E4', color: '#9A6B1E', border: '1px solid #E0CFB0', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>CUSTOM</span>}
                        <span style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}`, borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{r.score} — {r.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8C887E', marginBottom: 5 }}>
                      <span style={{ fontWeight: 600 }}>{entry.category}</span> · Who: {entry.who}
                    </div>
                    <div style={{ fontSize: 12, color: '#5C5852', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: '#2A2A28' }}>Controls: </span>{entry.existingControls}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tip footer */}
            {isAdmin && (
              <div style={{ borderTop: '1px solid #E4DDD2', padding: '12px 20px', flexShrink: 0, background: '#F5F2EB', borderRadius: '0 0 14px 14px' }}>
                <p style={{ fontSize: 12, color: '#8C887E', margin: 0, fontFamily: 'inherit', lineHeight: 1.5 }}>
                  💡 To save a hazard to the library, click <strong style={{ color: '#9A6B1E' }}>📚 + Library</strong> on any hazard row. Manage saved entries from the <strong style={{ color: '#1C1C1A' }}>Hazard Library</strong> page in the main nav.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
