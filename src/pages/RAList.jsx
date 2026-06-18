import { useState } from 'react';
import { getRiskLevel, CATEGORY_COLORS } from '../data/riskData';
import { ALL_TEMPLATES } from '../data/templates';

const sans = "'DM Sans', system-ui, sans-serif";
const serif = "'Playfair Display', Georgia, serif";

function Badge({ label, color = '#1C1C1A' }) {
  return (
    <span style={{
      display: 'inline-block',
      background: color + '14', color,
      border: `1px solid ${color}28`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>
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
    // Archived assessments are hidden everywhere unless the Archived chip is active.
    if (a.status === 'archived' && filterStatus !== 'archived') return false;
    if (filterCat !== 'All' && a.category !== filterCat) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterFlag === 'overdue' && !(a.status === 'active' && isOverdue(a.reviewDate))) return false;
    if (filterFlag === 'high_critical' && !(a.hazards || []).some(h => ['High','Critical'].includes(getRiskLevel(h.likelihood, h.severity).label))) return false;
    if (search && !`${a.name} ${a.ref} ${a.location}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const needsReviewCount = assessments.filter(a => a.status === 'needs_review').length;
  const archivedCount    = assessments.filter(a => a.status === 'archived').length;
  const hasActiveFilter = filterStatus || filterFlag;

  return (
    <div style={{ animation: 'fadeIn .25s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: 26, fontWeight: 600, color: '#1C1C1A', fontFamily: serif, letterSpacing: '-0.01em' }}>Risk Assessments</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#8C887E', fontFamily: sans }}>{assessments.length} assessments · {filtered.length} shown</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTemplateModal(true)} style={{ background: '#F5F2EB', color: '#5C5852', border: '1px solid #E4DDD2', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>From template</button>
            <button onClick={onNew} style={{ background: '#1A3D2B', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ New assessment</button>
          </div>
        )}
      </div>

      {/* Status filters */}
      {(hasActiveFilter || needsReviewCount > 0 || archivedCount > 0) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#C8C2B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2, fontFamily: sans }}>Filter:</span>
          {[
            { label: 'All', status: null, flag: null },
            { label: 'Active', status: 'active', flag: null },
            { label: 'Draft', status: 'draft', flag: null },
            ...(needsReviewCount > 0 ? [{ label: `Needs Review (${needsReviewCount})`, status: 'needs_review', flag: null }] : []),
            { label: 'Overdue', status: null, flag: 'overdue' },
            { label: 'High/Critical', status: null, flag: 'high_critical' },
            ...(archivedCount > 0 ? [{ label: `Archived (${archivedCount})`, status: 'archived', flag: null }] : []),
          ].map(f => {
            const active = filterStatus === f.status && filterFlag === f.flag;
            return (
              <button key={f.label} onClick={() => { setFilterStatus(f.status); setFilterFlag(f.flag); }} style={{
                padding: '4px 11px', borderRadius: 5, border: '1px solid',
                borderColor: active ? '#1A3D2B' : '#E4DDD2',
                background: active ? '#1A3D2B' : '#FEFEFC',
                color: active ? '#fff' : '#5C5852',
                fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>{f.label}</button>
            );
          })}
          {hasActiveFilter && (
            <button onClick={() => { setFilterStatus(null); setFilterFlag(null); }} style={{ fontSize: 11, color: '#C8C2B8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', fontFamily: 'inherit' }}>✕ Clear</button>
          )}
        </div>
      )}

      {/* Category filters + search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid',
            borderColor: filterCat === c ? '#1A3D2B' : '#E4DDD2',
            background: filterCat === c ? '#1A3D2B' : '#FEFEFC',
            color: filterCat === c ? '#fff' : '#5C5852',
            cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>{c}</button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search assessments…"
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 6, border: '1px solid #E4DDD2', fontSize: 13, width: 220, fontFamily: 'inherit', outline: 'none', background: '#FEFEFC', color: '#1C1C1A' }}
        />
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((ra, i) => {
          const overdueFl = ra.status === 'active' && isOverdue(ra.reviewDate);
          const dueSoonFl = ra.status === 'active' && isDueSoon(ra.reviewDate);
          const critCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'Critical').length;
          const highCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'High').length;

          return (
            <div key={ra.id} style={{
              background: '#FEFEFC', border: '1px solid',
              borderColor: overdueFl ? '#D4A0A6' : dueSoonFl ? '#D4AA6A' : '#E4DDD2',
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              animation: `fadeUp .3s ${i * 0.03}s ease both`,
              transition: 'box-shadow 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.07)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ width: 3, height: 48, borderRadius: 2, background: CATEGORY_COLORS[ra.category] || '#8C887E', opacity: 0.55, flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#C8C2B8', minWidth: 28, fontFamily: sans }}>{ra.ref}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#1C1C1A', fontFamily: sans }}>{ra.name}</span>
                  <Badge label={ra.category || '—'} color={CATEGORY_COLORS[ra.category] || '#5C5852'} />
                  <Badge label={ra.status === 'needs_review' ? 'Needs Review' : ra.status || 'draft'} color={
                    ra.status === 'active' ? '#1A5C38' :
                    ra.status === 'needs_review' ? '#8B5B18' :
                    ra.status === 'archived' ? '#8C887E' : '#5C5852'
                  } />
                  {overdueFl && <Badge label="⚠ Review overdue" color="#8B2430" />}
                  {dueSoonFl && <Badge label="⚑ Due soon" color="#8B5B18" />}
                  {critCount > 0 && <Badge label={`${critCount} critical`} color="#452870" />}
                  {highCount > 0 && <Badge label={`${highCount} high`} color="#8B2430" />}
                </div>
                <div style={{ fontSize: 12, color: '#8C887E', fontFamily: sans }}>
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
                  }} style={{ background: '#FDF3E4', color: '#8B5B18', border: '1px solid #D4AA6A', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Mark reviewed</button>
                )}
                {isAdmin && reviewingId === ra.id && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#EAF4EE', border: '1px solid #9BCAAC', borderRadius: 7, padding: '5px 10px' }}>
                    <span style={{ fontSize: 11, color: '#1A5C38', fontWeight: 600, fontFamily: sans }}>Next review:</span>
                    <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)}
                      style={{ fontSize: 12, border: '1px solid #9BCAAC', borderRadius: 5, padding: '3px 7px', fontFamily: 'inherit', background: '#FEFEFC' }} />
                    <button onClick={() => { onMarkReviewed(ra.id, reviewDate); setReviewingId(null); }} style={{ background: '#1A3D2B', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
                    <button onClick={() => setReviewingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C8C2B8', fontSize: 16, padding: '0 2px' }}>✕</button>
                  </div>
                )}
                <button onClick={() => onPreview(ra)} style={{ background: '#F5F2EB', color: '#5C5852', border: '1px solid #E4DDD2', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Preview</button>
                {isAdmin && (
                  <>
                    <button onClick={() => onEdit(ra)} style={{ background: '#1A3D2B', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => onDuplicate(ra)} style={{ background: '#F5F2EB', color: '#5C5852', border: '1px solid #E4DDD2', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
                    <button onClick={() => { if (window.confirm(`Delete "${ra.name}"?`)) onDelete(ra.id); }} style={{ background: '#FAF0F1', color: '#8B2430', border: '1px solid #D4A0A6', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#C8C2B8', fontSize: 15, fontFamily: sans }}>
            {search ? `No assessments match "${search}"` : 'No assessments in this category.'}
          </div>
        )}
      </div>

      {/* Template modal */}
      {showTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,26,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn .2s ease both' }}>
          <div style={{ background: '#FEFEFC', borderRadius: 14, maxWidth: 760, width: '100%', maxHeight: '84vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, fontFamily: serif, color: '#1C1C1A' }}>Start from a template</h2>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8C887E' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#8C887E', margin: '0 0 18px', fontFamily: sans }}>All templates are pre-populated with hazards, controls and legislation. Every field is editable after selection.</p>
            {['Premises','Regular Activities','Events','Maintenance','Operations'].map(cat => {
              const items = ALL_TEMPLATES.filter(t => t.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: CATEGORY_COLORS[cat] || '#5C5852', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8, fontFamily: sans }}>{cat}</div>
                  {items.map(t => (
                    <button key={t.id} onClick={() => { onFromTemplate(t); setShowTemplateModal(false); }} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', background: '#F5F2EB', border: '1px solid #E4DDD2', borderRadius: 8,
                      padding: '11px 14px', cursor: 'pointer', textAlign: 'left', marginBottom: 6, fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#C8C2B8'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E4DDD2'}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#8C887E', marginRight: 8, fontFamily: sans }}>{t.ref}</span>
                        <span style={{ fontSize: 13, color: '#1C1C1A', fontFamily: sans }}>{t.name}</span>
                        <div style={{ fontSize: 11, color: '#C8C2B8', marginTop: 2, fontFamily: sans }}>{t.legislation}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 12 }}>
                        {t.involvesChildren && <Badge label="Children" color="#452870" />}
                        {t.involvesVulnerableAdults && <Badge label="Vuln. Adults" color="#8B5B18" />}
                        {t.involvesFood && <Badge label="Food" color="#1A5C38" />}
                        {t.isOutdoor && <Badge label="Outdoor" color="#0E6B82" />}
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
