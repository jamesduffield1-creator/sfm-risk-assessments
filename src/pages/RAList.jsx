import { useState } from 'react';
import { getRiskLevel, CATEGORY_COLORS } from '../data/riskData';
import { ALL_TEMPLATES } from '../data/templates';

const css = {
  btn: (bg, color, extra = {}) => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', ...extra }),
};

function Badge({ label, color = '#0f172a' }) {
  return (
    <span style={{ display: 'inline-block', background: color + '18', color, border: `1px solid ${color}33`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}

function isOverdue(d) { return d && new Date(d) < new Date(); }
function isDueSoon(d) { if (!d) return false; const diff = new Date(d) - new Date(); return diff > 0 && diff < 30*24*60*60*1000; }

export default function RAList({ assessments, filterCat, setFilterCat, filterStatus, setFilterStatus, filterFlag, setFilterFlag, isAdmin, saving, onEdit, onPreview, onDelete, onDuplicate, onMarkReviewed, onNew, onFromTemplate }) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewDate, setReviewDate] = useState('');

  const categories = ['All', ...['Premises','Regular Activities','Events','Maintenance','Operations'].filter(c => assessments.some(a => a.category === c))];

  const filtered = assessments.filter(a => {
    if (filterCat !== 'All' && a.category !== filterCat) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterFlag === 'overdue' && !(a.status === 'active' && isOverdue(a.reviewDate))) return false;
    if (filterFlag === 'high_critical' && !(a.hazards || []).some(h => ['High','Critical'].includes(getRiskLevel(h.likelihood, h.severity).label))) return false;
    if (search && !`${a.name} ${a.ref} ${a.location}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const needsReviewCount = assessments.filter(a => a.status === 'needs_review').length;
  const hasActiveFilter = filterStatus || filterFlag;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Risk Assessments</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{assessments.length} assessments · {filtered.length} shown</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTemplateModal(true)} style={css.btn('#f1f5f9', '#475569')}>From template</button>
            <button onClick={onNew} style={css.btn('#0f172a', '#fff')}>+ New assessment</button>
          </div>
        )}
      </div>

      {/* Status filters */}
      {(hasActiveFilter || needsReviewCount > 0) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Filter:</span>
          {[
            { label: 'All', status: null, flag: null },
            { label: 'Active', status: 'active', flag: null },
            { label: 'Draft', status: 'draft', flag: null },
            ...(needsReviewCount > 0 ? [{ label: `Needs Review (${needsReviewCount})`, status: 'needs_review', flag: null }] : []),
            { label: 'Overdue', status: null, flag: 'overdue' },
            { label: 'High/Critical', status: null, flag: 'high_critical' },
          ].map(f => {
            const active = filterStatus === f.status && filterFlag === f.flag;
            return (
              <button key={f.label} onClick={() => { setFilterStatus(f.status); setFilterFlag(f.flag); }} style={{
                padding: '4px 11px', borderRadius: 5, border: '1px solid',
                borderColor: active ? '#0f172a' : '#e2e8f0',
                background: active ? '#0f172a' : '#fff',
                color: active ? '#fff' : '#475569',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{f.label}</button>
            );
          })}
          {hasActiveFilter && (
            <button onClick={() => { setFilterStatus(null); setFilterFlag(null); }} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', fontFamily: 'inherit' }}>✕ Clear</button>
          )}
        </div>
      )}

      {/* Category filters + search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid',
            borderColor: filterCat === c ? '#0f172a' : '#e2e8f0',
            background: filterCat === c ? '#0f172a' : '#fff',
            color: filterCat === c ? '#fff' : '#475569',
            cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
          }}>{c}</button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search assessments…"
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, width: 220, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {filtered.map(ra => {
          const overdueFl = ra.status === 'active' && isOverdue(ra.reviewDate);
          const dueSoonFl = ra.status === 'active' && isDueSoon(ra.reviewDate);
          const critCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'Critical').length;
          const highCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'High').length;

          return (
            <div key={ra.id} style={{
              background: '#fff', border: '1px solid',
              borderColor: overdueFl ? '#fca5a5' : dueSoonFl ? '#fcd34d' : '#e2e8f0',
              borderRadius: 10, padding: '13px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 4, height: 48, borderRadius: 2, background: CATEGORY_COLORS[ra.category] || '#94a3b8', flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', fontFamily: 'Arial, sans-serif', minWidth: 28 }}>{ra.ref}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{ra.name}</span>
                  <Badge label={ra.category || '—'} color={CATEGORY_COLORS[ra.category] || '#64748b'} />
                  <Badge label={ra.status === 'needs_review' ? 'Needs Review' : ra.status || 'draft'} color={
                    ra.status === 'active' ? '#16a34a' :
                    ra.status === 'needs_review' ? '#d97706' :
                    ra.status === 'archived' ? '#94a3b8' : '#64748b'
                  } />
                  {overdueFl && <Badge label="⚠ Review overdue" color="#dc2626" />}
                  {dueSoonFl && <Badge label="⚑ Due soon" color="#d97706" />}
                  {critCount > 0 && <Badge label={`${critCount} critical`} color="#7c3aed" />}
                  {highCount > 0 && <Badge label={`${highCount} high`} color="#dc2626" />}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {ra.location}
                  {ra.hazards?.length > 0 && ` · ${ra.hazards.length} hazard${ra.hazards.length !== 1 ? 's' : ''}`}
                  {ra.reviewDate && ` · Review: ${new Date(ra.reviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  {ra.assessedBy && ` · ${ra.assessedBy}`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {isAdmin && ra.status === 'needs_review' && reviewingId !== ra.id && (
                  <button onClick={() => {
                    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                    setReviewDate(d.toISOString().slice(0, 10));
                    setReviewingId(ra.id);
                  }} style={css.btn('#fef3c7', '#d97706', { border: '1px solid #fcd34d' })}>✓ Mark reviewed</button>
                )}
                {isAdmin && reviewingId === ra.id && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '5px 10px' }}>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Next review:</span>
                    <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)}
                      style={{ fontSize: 12, border: '1px solid #bbf7d0', borderRadius: 5, padding: '3px 7px', fontFamily: 'inherit', background: '#fff' }} />
                    <button onClick={() => { onMarkReviewed(ra.id, reviewDate); setReviewingId(null); }} style={css.btn('#16a34a', '#fff')}>Confirm</button>
                    <button onClick={() => setReviewingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: '0 2px' }}>✕</button>
                  </div>
                )}
                <button onClick={() => onPreview(ra)} style={css.btn('#f1f5f9', '#475569')}>Preview</button>
                {isAdmin && (
                  <>
                    <button onClick={() => onEdit(ra)} style={css.btn('#0f172a', '#fff')}>Edit</button>
                    <button onClick={() => onDuplicate(ra)} style={css.btn('#f1f5f9', '#475569')}>Copy</button>
                    <button onClick={() => { if (window.confirm(`Delete "${ra.name}"?`)) onDelete(ra.id); }} style={css.btn('#fee2e2', '#dc2626')}>Delete</button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 15 }}>
            {search ? `No assessments match "${search}"` : 'No assessments in this category.'}
          </div>
        )}
      </div>

      {/* Template modal */}
      {showTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000077', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 760, width: '100%', maxHeight: '84vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Start from a template</h2>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px' }}>All templates are pre-populated with hazards, controls and legislation. Every field is editable after selection.</p>
            {['Premises','Regular Activities','Events','Maintenance','Operations'].map(cat => {
              const items = ALL_TEMPLATES.filter(t => t.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: CATEGORY_COLORS[cat] || '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{cat}</div>
                  {items.map(t => (
                    <button key={t.id} onClick={() => { onFromTemplate(t); setShowTemplateModal(false); }} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                      padding: '11px 14px', cursor: 'pointer', textAlign: 'left', marginBottom: 6, fontFamily: 'inherit',
                    }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginRight: 8 }}>{t.ref}</span>
                        <span style={{ fontSize: 13, color: '#0f172a' }}>{t.name}</span>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.legislation}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 12 }}>
                        {t.involvesChildren && <Badge label="Children" color="#7c3aed" />}
                        {t.involvesVulnerableAdults && <Badge label="Vuln. Adults" color="#d97706" />}
                        {t.involvesFood && <Badge label="Food" color="#16a34a" />}
                        {t.isOutdoor && <Badge label="Outdoor" color="#0891b2" />}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
