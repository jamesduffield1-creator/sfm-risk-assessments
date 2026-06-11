import { useState } from 'react';
import { HAZARD_BANK, CATEGORY_COLORS, WHO_AT_RISK_OPTIONS } from '../data/riskData';
import { ALL_TEMPLATES } from '../data/templates';

// ─── Which hazard bank categories are relevant for each combination ────────────
const CATEGORY_HAZARD_GROUPS = {
  'Premises':           ['Trips & Falls', 'Slips', 'Fire', 'Electricity', 'Manual Handling', 'Security'],
  'Regular Activities': ['Trips & Falls', 'Slips', 'Security'],
  'Events':             ['Trips & Falls', 'Slips', 'Fire', 'Manual Handling', 'Security'],
  'Maintenance':        ['Falls from Height', 'Manual Handling', 'Electricity', 'Trips & Falls'],
  'Operations':         ['Security', 'Manual Handling', 'Trips & Falls'],
  'Other':              ['Trips & Falls', 'Slips', 'Security'],
};

const FLAG_HAZARD_GROUPS = {
  involvesChildren:        ['Safeguarding'],
  involvesVulnerableAdults:['Safeguarding'],
  involvesFood:            ['Food & Allergens'],
  isOutdoor:               ['Trips & Falls', 'Slips'],
};

const LEGISLATION_DEFAULTS = {
  'Premises':           'HSWA 1974, MHSWR 1999, RRO 2005',
  'Regular Activities': 'HSWA 1974, MHSWR 1999',
  'Events':             'HSWA 1974, MHSWR 1999',
  'Maintenance':        'HSWA 1974, MHSWR 1999, WAHR 2005',
  'Operations':         'HSWA 1974, MHSWR 1999',
  'Other':              'HSWA 1974, MHSWR 1999',
};

const FLAGS = [
  { key: 'involvesChildren',        label: 'Involves children',          icon: '👧', note: 'Adds safeguarding hazards' },
  { key: 'involvesVulnerableAdults',label: 'Involves vulnerable adults',  icon: '🤝', note: 'Adds safeguarding hazards' },
  { key: 'involvesFood',            label: 'Involves food or drink',      icon: '🍽', note: 'Adds allergen & hygiene hazards' },
  { key: 'isOutdoor',               label: 'Outdoor or off-site',         icon: '🌤', note: 'Adds weather & surface hazards' },
];

const CATEGORIES = ['Premises', 'Regular Activities', 'Events', 'Maintenance', 'Operations', 'Other'];

function getSuggestedGroups(category, flags) {
  const groups = new Set(CATEGORY_HAZARD_GROUPS[category] || []);
  FLAGS.forEach(f => {
    if (flags[f.key]) {
      (FLAG_HAZARD_GROUPS[f.key] || []).forEach(g => groups.add(g));
    }
  });
  return [...groups];
}

function buildHazardDefaults(group) {
  // Return a sensible default object for a hazard from the bank
  const defaults = {
    'Trips & Falls':    { likelihood: 2, severity: 2, existingControls: 'Regular inspection of floor surfaces and walkways. Hazards reported and addressed promptly.' },
    'Slips':            { likelihood: 2, severity: 2, existingControls: 'Wet floor signs available. Spillages cleaned immediately. Non-slip mats at entrances.' },
    'Fire':             { likelihood: 1, severity: 3, existingControls: 'Fire exits checked before every gathering. Fire extinguishers serviced annually.' },
    'Electricity':      { likelihood: 1, severity: 3, existingControls: 'PAT testing completed annually. Fixed wiring inspected every 5 years.' },
    'Manual Handling':  { likelihood: 2, severity: 2, existingControls: 'Trolleys available. Volunteers advised not to lift alone. Manual handling guidance shared.' },
    'Falls from Height':{ likelihood: 1, severity: 3, existingControls: 'Appropriate access equipment used. Second person present. Damaged equipment removed from use.' },
    'Safeguarding':     { likelihood: 2, severity: 3, existingControls: 'All leaders trained to Foundation level. PSO contact known. Two-adult rule applied.' },
    'Food & Allergens': { likelihood: 2, severity: 3, existingControls: "Allergen information available. Natasha's Law requirements followed. Volunteers trained in allergen awareness." },
    'Security':         { likelihood: 1, severity: 2, existingControls: 'Building secured when unoccupied. Lone working policy applied. Incident reporting in place.' },
  };
  return defaults[group] || { likelihood: 2, severity: 2, existingControls: '' };
}

const css = {
  btn:   (bg, color, extra = {}) => ({ background: bg, color, border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', ...extra }),
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 14, color: '#1C1C1A', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#8C887E', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' },
};

export default function RAWizard({ onConfirm, onCancel }) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [name, setName]         = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('St Francis Mackworth');

  // Step 2 state
  const [flags, setFlags] = useState({
    involvesChildren: false, involvesVulnerableAdults: false,
    involvesFood: false, isOutdoor: false,
  });

  // Step 3 state — selected hazard text strings
  const [selectedHazards, setSelectedHazards] = useState(null); // null = not yet initialised

  // Step 4 state
  const [chosenTemplate, setChosenTemplate] = useState(null); // null = use wizard build

  const suggestedGroups  = getSuggestedGroups(category, flags);
  const matchingTemplates = ALL_TEMPLATES.filter(t => t.category === category && category !== '');

  // Initialise selections when entering step 3
  const enterStep3 = () => {
    if (selectedHazards === null) {
      // Pre-select all suggested hazards
      const initial = {};
      suggestedGroups.forEach(group => {
        (HAZARD_BANK[group] || []).forEach(h => { initial[h] = true; });
      });
      setSelectedHazards(initial);
    }
    setStep(3);
  };

  const toggleHazard = (text) => {
    setSelectedHazards(prev => ({ ...prev, [text]: !prev[text] }));
  };

  const toggleGroup = (group, value) => {
    const updated = { ...selectedHazards };
    (HAZARD_BANK[group] || []).forEach(h => { updated[h] = value; });
    setSelectedHazards(updated);
  };

  const selectedCount = selectedHazards ? Object.values(selectedHazards).filter(Boolean).length : 0;

  const handleConfirm = () => {
    if (chosenTemplate) {
      // Start from a template but with the name/location from wizard
      const reviewDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + (chosenTemplate.reviewMonths || 12)); return d.toISOString().slice(0, 10); })();
      onConfirm({
        ...chosenTemplate,
        id: 'ra_' + Date.now(),
        name: name || chosenTemplate.name,
        location: location || chosenTemplate.location,
        status: 'draft', version: 1,
        assessedBy: '', assessedDate: new Date().toISOString().slice(0, 10),
        approvedBy: '', reviewDate, pccNoted: '', vicarSignoff: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Build from wizard selections
    const reviewDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })();
    const hazards = [];
    suggestedGroups.forEach(group => {
      (HAZARD_BANK[group] || []).forEach(text => {
        if (selectedHazards?.[text]) {
          const def = buildHazardDefaults(group);
          hazards.push({
            hazard: text,
            who: '',
            existingControls: def.existingControls,
            likelihood: def.likelihood,
            severity: def.severity,
            additionalControls: '',
            owner: 'Operations Manager',
            deadline: '',
          });
        }
      });
    });

    // Who at risk defaults based on flags
    const whoAtRisk = [];
    if (flags.involvesChildren) whoAtRisk.push('Children (under 18)', 'Volunteers');
    if (flags.involvesVulnerableAdults) whoAtRisk.push('Vulnerable adults');
    if (!whoAtRisk.length) whoAtRisk.push('Congregation members', 'Volunteers');

    onConfirm({
      id: 'ra_' + Date.now(),
      ref: '', name, category, location,
      legislation: LEGISLATION_DEFAULTS[category] || 'HSWA 1974, MHSWR 1999',
      reviewMonths: 12,
      whoAtRisk: [...new Set(whoAtRisk)],
      ...flags,
      hazards,
      status: 'draft', version: 1,
      assessedBy: '', assessedDate: new Date().toISOString().slice(0, 10),
      approvedBy: '', reviewDate, pccNoted: '', vicarSignoff: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background: '#1A3D2B', borderRadius: '14px 14px 0 0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>New Risk Assessment</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.01em' }}>
              {step === 1 && 'Step 1 — About this activity'}
              {step === 2 && 'Step 2 — Activity characteristics'}
              {step === 3 && 'Step 3 — Suggested hazards'}
              {step === 4 && 'Step 4 — Similar templates'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ width: 28, height: 6, borderRadius: 3, background: n <= step ? '#C8952E' : 'rgba(255,255,255,.25)' }} />
            ))}
          </div>
        </div>

        <div style={{ padding: 28 }}>

          {/* ── Step 1: Name / Category / Location ── */}
          {step === 1 && (
            <div>
              <p style={{ margin: '0 0 22px', fontSize: 14, color: '#5C5852' }}>
                Tell us what this assessment covers and we'll suggest relevant hazards.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={css.label}>Activity / Assessment Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  style={css.input} placeholder="e.g. Sunday Service, Youth Weekend Away, Kitchen Cleaning"
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={css.label}>Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{
                      padding: '10px 8px', borderRadius: 8, border: '2px solid',
                      borderColor: category === c ? (CATEGORY_COLORS[c] || '#1A3D2B') : '#E4DDD2',
                      background: category === c ? (CATEGORY_COLORS[c] || '#1A3D2B') + '15' : '#F5F2EB',
                      color: category === c ? (CATEGORY_COLORS[c] || '#1A3D2B') : '#5C5852',
                      fontWeight: category === c ? 700 : 500, fontSize: 13,
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={css.label}>Location / Area</label>
                <input value={location} onChange={e => setLocation(e.target.value)} style={css.input} placeholder="St Francis Mackworth" />
              </div>
            </div>
          )}

          {/* ── Step 2: Flags ── */}
          {step === 2 && (
            <div>
              <p style={{ margin: '0 0 22px', fontSize: 14, color: '#5C5852' }}>
                Select everything that applies. This helps us suggest the right hazards.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FLAGS.map(({ key, label, icon, note }) => {
                  const on = flags[key];
                  return (
                    <div key={key} onClick={() => setFlags(f => ({ ...f, [key]: !f[key] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: '2px solid', borderColor: on ? '#1A3D2B' : '#E4DDD2', background: on ? '#1A3D2B' : '#F5F2EB', cursor: 'pointer' }}>
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: on ? '#fff' : '#1A3D2B' }}>{label}</div>
                        <div style={{ fontSize: 12, color: on ? 'rgba(255,255,255,.65)' : '#8C887E', marginTop: 2 }}>{note}</div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid', borderColor: on ? '#fff' : '#C8C2B8', background: on ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {on && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1A3D2B' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Suggested hazards ── */}
          {step === 3 && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 14, color: '#5C5852' }}>
                Based on your answers, we've pre-selected relevant hazards. Untick anything you don't need.
              </p>
              <p style={{ margin: '0 0 18px', fontSize: 12, color: '#C8C2B8' }}>
                {selectedCount} hazard{selectedCount !== 1 ? 's' : ''} selected · You can add more in the editor
              </p>
              {suggestedGroups.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#C8C2B8' }}>
                  No category selected — hazards will be added manually in the editor.
                </div>
              )}
              {suggestedGroups.map(group => {
                const items = HAZARD_BANK[group] || [];
                const groupSelected = items.filter(h => selectedHazards?.[h]).length;
                return (
                  <div key={group} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2A2A28', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => toggleGroup(group, true)} style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>All</button>
                        <button onClick={() => toggleGroup(group, false)} style={{ fontSize: 11, color: '#C8C2B8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>None</button>
                        <span style={{ fontSize: 11, color: '#C8C2B8' }}>{groupSelected}/{items.length}</span>
                      </div>
                    </div>
                    {items.map(text => {
                      const on = selectedHazards?.[text] ?? true;
                      return (
                        <div key={text} onClick={() => toggleHazard(text)}
                          style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', marginBottom: 4, borderRadius: 7, border: '1px solid', borderColor: on ? '#C8C2B8' : '#F5F2EB', background: on ? '#F5F2EB' : '#fff', cursor: 'pointer' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid', borderColor: on ? '#1A3D2B' : '#C8C2B8', background: on ? '#1A3D2B' : '#fff', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {on && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 13, color: on ? '#1A3D2B' : '#C8C2B8', lineHeight: 1.4 }}>{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Step 4: Similar templates ── */}
          {step === 4 && (
            <div>
              {matchingTemplates.length > 0 ? (
                <>
                  <p style={{ margin: '0 0 6px', fontSize: 14, color: '#5C5852' }}>
                    We have {matchingTemplates.length} ready-made template{matchingTemplates.length !== 1 ? 's' : ''} for <strong>{category}</strong> activities.
                  </p>
                  <p style={{ margin: '0 0 18px', fontSize: 13, color: '#C8C2B8' }}>
                    Start from a template for a fully pre-filled assessment, or use your custom hazard selection from step 3.
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <div onClick={() => setChosenTemplate(null)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 9, border: '2px solid', borderColor: chosenTemplate === null ? '#1A3D2B' : '#E4DDD2', background: chosenTemplate === null ? '#0f172a0d' : '#fff', cursor: 'pointer', marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: chosenTemplate === null ? '#1A3D2B' : '#C8C2B8', background: chosenTemplate === null ? '#1A3D2B' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {chosenTemplate === null && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1C1C1A' }}>Use my custom hazard selection</div>
                        <div style={{ fontSize: 12, color: '#8C887E', marginTop: 1 }}>{selectedCount} hazards selected in step 3</div>
                      </div>
                    </div>
                    {matchingTemplates.map(t => (
                      <div key={t.id} onClick={() => setChosenTemplate(t)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 9, border: '2px solid', borderColor: chosenTemplate?.id === t.id ? '#9A6B1E' : '#E4DDD2', background: chosenTemplate?.id === t.id ? '#FDF5E4' : '#F5F2EB', cursor: 'pointer', marginBottom: 8 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: chosenTemplate?.id === t.id ? '#9A6B1E' : '#C8C2B8', background: chosenTemplate?.id === t.id ? '#9A6B1E' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {chosenTemplate?.id === t.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#1C1C1A' }}><span style={{ color: '#C8C2B8', marginRight: 6 }}>{t.ref}</span>{t.name}</div>
                          <div style={{ fontSize: 12, color: '#8C887E', marginTop: 2 }}>{t.hazards?.length || 0} hazards · {t.legislation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1C1C1A', marginBottom: 6 }}>Ready to go</div>
                  <p style={{ fontSize: 14, color: '#8C887E', margin: 0 }}>
                    No pre-built templates for this category — your {selectedCount} suggested hazards will be pre-loaded into the editor.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={step === 1 ? onCancel : () => setStep(s => s - 1)} style={css.btn('#F5F2EB', '#5C5852')}>
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {step < 4 && (
                <button
                  onClick={() => {
                    if (step === 2) { enterStep3(); }
                    else if (step === 3) { setStep(4); }
                    else { setStep(s => s + 1); }
                  }}
                  disabled={step === 1 && !name.trim()}
                  style={css.btn(step === 1 && !name.trim() ? '#E4DDD2' : '#1A3D2B', step === 1 && !name.trim() ? '#C8C2B8' : '#fff')}
                >
                  Next →
                </button>
              )}
              {step === 4 && (
                <button onClick={handleConfirm} style={css.btn('#1A3D2B', '#fff')}>
                  Open in editor →
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
