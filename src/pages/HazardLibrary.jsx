import { useState, useMemo, useEffect } from 'react';
import {
  BUILT_IN_LIBRARY, LIBRARY_CATEGORIES,
  loadCustomLibrary, saveCustomLibrary, refreshCustomLibrary,
} from '../data/hazardLibrary';
import { getRiskLevel } from '../data/riskData';

const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', system-ui, sans-serif";

const inputStyle = { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #E4DDD2', fontSize: 13, color: '#1C1C1A', background: '#FEFEFC', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { display: 'block', fontSize: 10, fontWeight: 600, color: '#8C887E', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' };

export default function HazardLibrary({ isAdmin }) {
  const [category, setCategory] = useState('All');
  const [search, setSearch]     = useState('');
  const [customEntries, setCustomEntries] = useState(() => loadCustomLibrary());
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft]         = useState(null);

  // Pull the latest custom entries from Sheets on mount (localStorage shows instantly).
  useEffect(() => {
    refreshCustomLibrary().then(remote => { if (remote) setCustomEntries(remote); });
  }, []);

  const customIds  = useMemo(() => new Set(customEntries.map(c => c.id)), [customEntries]);
  const allEntries = useMemo(() => [...BUILT_IN_LIBRARY, ...customEntries], [customEntries]);

  const filtered = useMemo(() => allEntries.filter(e => {
    if (category !== 'All' && e.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.hazard.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.who || '').toLowerCase().includes(q) ||
        (e.existingControls || '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [allEntries, category, search]);

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setDraft({ ...entry });
  };
  const cancelEdit = () => { setEditingId(null); setDraft(null); };
  const saveEdit = () => {
    if (!draft || !draft.hazard) return;
    const next = customEntries.map(e => e.id === editingId ? { ...draft, id: editingId } : e);
    setCustomEntries(next);
    saveCustomLibrary(next);
    cancelEdit();
  };
  const deleteEntry = (id) => {
    if (!window.confirm('Delete this custom hazard entry?')) return;
    const next = customEntries.filter(e => e.id !== id);
    setCustomEntries(next);
    saveCustomLibrary(next);
    if (editingId === id) cancelEdit();
  };
  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div style={{ animation: 'fadeIn .25s ease both' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 600, color: '#1C1C1A', fontFamily: serif, letterSpacing: '-0.01em' }}>Hazard Library</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#8C887E', fontFamily: sans }}>
          {BUILT_IN_LIBRARY.length} pre-built hazards
          {customEntries.length > 0 && ` · ${customEntries.length} custom`}
          {' · '}{filtered.length} shown
        </p>
      </div>

      {/* Categories + search */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {LIBRARY_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: '5px 12px', borderRadius: 6, border: '1px solid',
            borderColor: category === c ? '#9A6B1E' : '#E4DDD2',
            background: category === c ? '#9A6B1E' : '#FEFEFC',
            color: category === c ? '#fff' : '#5C5852',
            cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>{c}</button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search hazards, categories, controls…"
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 6, border: '1px solid #E4DDD2', fontSize: 13, width: 280, fontFamily: 'inherit', outline: 'none', background: '#FEFEFC', color: '#1C1C1A' }}
        />
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#C8C2B8', fontSize: 15, fontFamily: sans }}>
            {search ? `No hazards match "${search}"` : 'No hazards in this category.'}
          </div>
        )}
        {filtered.map((entry, i) => {
          const r = getRiskLevel(entry.likelihood, entry.severity);
          const isCustom = customIds.has(entry.id);
          const isEditing = editingId === entry.id;

          if (isEditing && draft) {
            return (
              <div key={entry.id} style={{
                background: '#FDF5E4',
                border: '1px solid #E0CFB0',
                borderLeft: '3px solid #9A6B1E',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9A6B1E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: sans }}>
                  Editing custom entry
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={draft.category} onChange={e => setField('category', e.target.value)} style={inputStyle}>
                      {LIBRARY_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Who is at risk</label>
                    <input value={draft.who || ''} onChange={e => setField('who', e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Hazard description</label>
                  <input value={draft.hazard || ''} onChange={e => setField('hazard', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Existing controls</label>
                  <textarea value={draft.existingControls || ''} onChange={e => setField('existingControls', e.target.value)} style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Likelihood</label>
                    <select value={draft.likelihood} onChange={e => setField('likelihood', Number(e.target.value))} style={inputStyle}>
                      <option value={1}>1 — Unlikely</option><option value={2}>2 — Possible</option><option value={3}>3 — Likely</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Severity</label>
                    <select value={draft.severity} onChange={e => setField('severity', Number(e.target.value))} style={inputStyle}>
                      <option value={1}>1 — Minor</option><option value={2}>2 — Significant</option><option value={3}>3 — Major/Fatal</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Additional controls</label>
                    <input value={draft.additionalControls || ''} onChange={e => setField('additionalControls', e.target.value)} style={inputStyle} placeholder="Optional" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={cancelEdit} style={{ background: '#FEFEFC', color: '#5C5852', border: '1px solid #E4DDD2', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={saveEdit} style={{ background: '#1A3D2B', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save changes</button>
                </div>
              </div>
            );
          }

          return (
            <div key={entry.id} style={{
              background: '#FEFEFC',
              border: `1px solid ${r.border}`,
              borderLeft: `3px solid ${r.color}`,
              borderRadius: 10, padding: '13px 16px',
              animation: `fadeUp .3s ${Math.min(i, 20) * 0.02}s ease both`,
              transition: 'box-shadow 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.07)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A', flex: 1, fontFamily: sans }}>{entry.hazard}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {isCustom && <span style={{ fontSize: 10, background: '#FDF5E4', color: '#9A6B1E', border: '1px solid #E0CFB0', borderRadius: 3, padding: '2px 7px', fontWeight: 700, letterSpacing: '0.04em' }}>CUSTOM</span>}
                  <span style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}`, borderRadius: 4, padding: '2px 9px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{r.score} — {r.label}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#8C887E', marginBottom: 8, fontFamily: sans }}>
                <span style={{ fontWeight: 600 }}>{entry.category}</span>
                {entry.who && <> · Who: {entry.who}</>}
              </div>
              <div style={{ fontSize: 13, color: '#2A2A28', lineHeight: 1.55, fontFamily: sans }}>
                <span style={{ fontWeight: 600, color: '#1C1C1A' }}>Controls: </span>{entry.existingControls}
              </div>
              {entry.additionalControls && (
                <div style={{ fontSize: 13, color: '#2A2A28', lineHeight: 1.55, marginTop: 5, fontFamily: sans }}>
                  <span style={{ fontWeight: 600, color: '#1C1C1A' }}>Additional: </span>{entry.additionalControls}
                </div>
              )}
              {isAdmin && isCustom && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTop: '1px solid #E4DDD2' }}>
                  <button onClick={() => startEdit(entry)}
                    style={{ background: '#F5F2EB', color: '#5C5852', border: '1px solid #E4DDD2', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={() => deleteEntry(entry.id)}
                    style={{ background: '#FAF0F1', color: '#8B2430', border: '1px solid #D4A0A6', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 8, fontSize: 12, color: '#8C887E', fontFamily: sans, lineHeight: 1.55 }}>
        Browse and search the hazard library here. To save a new entry, open or create a risk assessment and click <strong style={{ color: '#9A6B1E' }}>📚 + Library</strong> on any hazard row.
        {isAdmin
          ? <> Custom entries can be edited or deleted from this page.</>
          : <> Admin access is required to add or edit entries.</>}
        <br />
        <span style={{ fontSize: 11, color: '#C8C2B8' }}>Custom entries sync to Google Sheets and are shared across all devices. A local copy is also kept for offline use.</span>
      </div>
    </div>
  );
}
