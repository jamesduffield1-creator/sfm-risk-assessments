import { useState, useMemo } from 'react';
import { BUILT_IN_LIBRARY, LIBRARY_CATEGORIES, loadCustomLibrary } from '../data/hazardLibrary';
import { getRiskLevel } from '../data/riskData';

const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', system-ui, sans-serif";

export default function HazardLibrary({ isAdmin }) {
  const [category, setCategory] = useState('All');
  const [search, setSearch]     = useState('');

  const customEntries = useMemo(() => loadCustomLibrary(), []);
  const customIds     = useMemo(() => new Set(customEntries.map(c => c.id)), [customEntries]);
  const allEntries    = useMemo(() => [...BUILT_IN_LIBRARY, ...customEntries], [customEntries]);

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
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 8, fontSize: 12, color: '#8C887E', fontFamily: sans }}>
        Browse and search the hazard library here. To add any of these to an assessment, open or create a risk assessment and click <strong style={{ color: '#9A6B1E' }}>📚 Hazard library</strong>{isAdmin ? ' from the editor.' : '. Admin access is required to edit assessments.'}
      </div>
    </div>
  );
}
