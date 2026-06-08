import { useState } from 'react';
import { getRiskLevel, WHO_AT_RISK_OPTIONS, HAZARD_BANK, CATEGORY_COLORS } from '../data/riskData';

const css = {
  input:    { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a', background: '#fff', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit' },
  select:   { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  btn:      (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  label:    { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' },
};

function Field({ label, children, note }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={css.label}>{label}</label>
      {children}
      {note && <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>{note}</p>}
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

  const addFromBank = (text) => {
    update('hazards', [...(local.hazards || []), { hazard: text, who: '', existingControls: '', likelihood: 2, severity: 2, additionalControls: '', owner: '', deadline: '' }]);
    setBankOpen(false);
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'sticky', top: 58, zIndex: 50, background: '#f8fafc', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={css.btn('#f1f5f9', '#475569')}>← Back</button>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            {local.ref ? `${local.ref} — ` : ''}{local.name || 'New Assessment'}
          </h2>
          {dirty && <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>Unsaved changes</span>}
          {saving && <span style={{ fontSize: 12, color: '#64748b' }}>Saving…</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onPreview(local)} style={css.btn('#f1f5f9', '#0f172a')}>Preview</button>
          <button onClick={() => { onSave(local); setDirty(false); }} style={css.btn('#0f172a', '#fff')}>Save</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Main */}
        <div>
          {/* Assessment details */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>Assessment Details</h3>
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
                  <option value="review">Needs Review</option>
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
                    }} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid', borderColor: sel ? '#0f172a' : '#e2e8f0', background: sel ? '#0f172a' : '#f8fafc', color: sel ? '#fff' : '#475569', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{opt}</button>
                  );
                })}
              </div>
            </Field>
          </div>

          {/* Hazards */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                Hazards & Controls ({(local.hazards || []).length})
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setBankOpen(b => !b)} style={css.btn('#f1f5f9', '#475569')}>{bankOpen ? '▲ Hide bank' : '▼ Hazard bank'}</button>
                <button onClick={addHazard} style={css.btn('#0f172a', '#fff')}>+ Add hazard</button>
              </div>
            </div>

            {/* Hazard bank */}
            {bankOpen && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', fontWeight: 600 }}>Click to add:</p>
                {Object.entries(HAZARD_BANK).map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {items.map(h => (
                        <button key={h} onClick={() => addFromBank(h)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>{h}</button>
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
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>#{idx + 1}</span>
                      <button onClick={() => moveHazard(idx, -1)} disabled={idx === 0} style={{ background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: idx === 0 ? 'default' : 'pointer', padding: '2px 7px', fontSize: 12, opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                      <button onClick={() => moveHazard(idx, 1)} disabled={idx === local.hazards.length - 1} style={{ background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: idx === local.hazards.length - 1 ? 'default' : 'pointer', padding: '2px 7px', fontSize: 12, opacity: idx === local.hazards.length - 1 ? 0.4 : 1 }}>↓</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <RiskBadge likelihood={hz.likelihood} severity={hz.severity} />
                      <button onClick={() => removeHazard(idx)} style={{ background: '#fee2e2', border: 'none', borderRadius: 4, color: '#dc2626', cursor: 'pointer', padding: '3px 8px', fontSize: 12 }}>✕</button>
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
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No hazards yet. Use the hazard bank or add manually.</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 120, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Flags */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>Activity Flags</h3>
            {[
              ['involvesChildren',       'Involves children',        "Apply children's ratios, DBS, safeguarding"],
              ['involvesVulnerableAdults','Involves vulnerable adults','Apply safeguarding + medical controls'],
              ['involvesFood',           'Involves food',             "Apply Natasha's Law, allergen, hygiene controls"],
              ['isOutdoor',              'Outdoor / off-site',        'Apply weather, transport, outdoor controls'],
            ].map(([field, label, note]) => (
              <div key={field} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div onClick={() => update(field, !local[field])} style={{ width: 36, height: 20, borderRadius: 10, background: local[field] ? '#0f172a' : '#e2e8f0', cursor: 'pointer', position: 'relative', flexShrink: 0, marginTop: 2 }}>
                  <div style={{ position: 'absolute', top: 2, left: local[field] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{note}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Risk summary */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>Risk Summary</h3>
            {[['Low','#16a34a','#dcfce7','#86efac'],['Medium','#d97706','#fef3c7','#fcd34d'],['High','#dc2626','#fee2e2','#fca5a5'],['Critical','#7c3aed','#ede9fe','#c4b5fd']].map(([level, color, bg, border]) => (
              <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{level}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: riskSummary[level] > 0 ? color : '#cbd5e1' }}>{riskSummary[level]}</span>
              </div>
            ))}
          </div>

          {/* References */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>References</h3>
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 5px' }}><strong>Ecclesiastical:</strong> 0345 600 7531</p>
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 5px' }}><strong>RIDDOR:</strong> hse.gov.uk/riddor</p>
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}><strong>HSE guidance:</strong> hse.gov.uk/risk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
