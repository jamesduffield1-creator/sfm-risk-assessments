import { getRiskLevel, CATEGORY_COLORS } from '../data/riskData';

function StatCard({ value, label, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '18px 20px', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 5 }}>{label}</div>
    </div>
  );
}

function ReviewAlert({ assessments, onViewList }) {
  const overdue = assessments.filter(a => a.status === 'active' && a.reviewDate && new Date(a.reviewDate) < new Date());
  const soon    = assessments.filter(a => a.status === 'active' && a.reviewDate && (() => { const d = new Date(a.reviewDate) - new Date(); return d > 0 && d < 30*24*60*60*1000; })());

  if (!overdue.length && !soon.length) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {overdue.length > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>⚠ {overdue.length} assessment{overdue.length > 1 ? 's' : ''} overdue for review</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {overdue.map(a => (
              <span key={a.id} style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{a.ref} — {a.name}</span>
            ))}
          </div>
        </div>
      )}
      {soon.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontWeight: 700, color: '#d97706', marginBottom: 6 }}>⚑ {soon.length} assessment{soon.length > 1 ? 's' : ''} due for review within 30 days</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {soon.map(a => (
              <span key={a.id} style={{ background: '#fff', color: '#d97706', border: '1px solid #fcd34d', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{a.ref} — {a.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ stats, assessments, staff, settings, isAdmin, onViewList, onEditRA, onPreviewRA }) {
  const staffMap = Object.fromEntries((staff || []).map(s => [s.key, s]));

  const keyRoles = [
    { key: 'vicar',        label: 'Vicar' },
    { key: 'ops_manager',  label: 'Operations Manager' },
    { key: 'pso',          label: 'Parish Safeguarding Officer' },
    { key: 'cf_pastor',    label: 'Children & Families Pastor' },
    { key: 'youth_pastor', label: 'Youth Pastor' },
  ];

  // Recently updated RAs
  const recent = [...assessments]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{settings?.church_name} · {settings?.diocese} · {settings?.network}</p>
      </div>

      <ReviewAlert assessments={assessments} onViewList={onViewList} />

      {/* Stats row */}
      <div className="stat-grid">
        <StatCard value={stats.total}       label="Total assessments"         color="#0f172a"  onClick={onViewList} />
        <StatCard value={stats.active}      label="Active"                    color="#16a34a"  onClick={onViewList} />
        <StatCard value={stats.draft}       label="Draft"                     color="#64748b"  onClick={onViewList} />
        <StatCard value={stats.overdue}     label="Overdue review"            color={stats.overdue  > 0 ? '#dc2626' : '#16a34a'} onClick={onViewList} />
        <StatCard value={stats.dueSoon}     label="Due within 30 days"        color={stats.dueSoon  > 0 ? '#d97706' : '#16a34a'} onClick={onViewList} />
        <StatCard value={stats.highCritical} label="Contain high/critical risks" color={stats.highCritical > 0 ? '#dc2626' : '#16a34a'} onClick={onViewList} />
      </div>

      <div className="two-col-grid">
        {/* By category */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>By Category</h3>
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: CATEGORY_COLORS[cat] || '#94a3b8', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{cat}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Key staff */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>Key Contacts</h3>
          {keyRoles.map(({ key, label }) => {
            const person = staffMap[key];
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 600, color: person?.name && person.name !== 'TBC' ? '#0f172a' : '#94a3b8' }}>
                  {person?.name || 'TBC'}
                </span>
              </div>
            );
          })}
          {isAdmin && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <a href="#" onClick={e => { e.preventDefault(); }} style={{ fontSize: 12, color: '#3b82f6' }}>
                Update staff details in Settings →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>Recently Updated</h3>
        {recent.map(ra => {
          const critCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'Critical').length;
          const highCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'High').length;
          return (
            <div key={ra.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 4, height: 36, borderRadius: 2, background: CATEGORY_COLORS[ra.category] || '#94a3b8', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{ra.ref} — {ra.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{ra.category} · Updated {new Date(ra.updatedAt).toLocaleDateString('en-GB')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {critCount > 0 && <span style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>{critCount} critical</span>}
                {highCount > 0 && <span style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>{highCount} high</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onPreviewRA(ra)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Preview</button>
                {isAdmin && <button onClick={() => onEditRA(ra)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance references */}
      <div className="four-col-grid">
        {[
          { label: 'Ecclesiastical Insurance', value: '0345 600 7531', sub: 'Risk advice line Mon–Fri 9–5' },
          { label: 'HSE Risk Guidance', value: 'hse.gov.uk', sub: 'simple-health-safety/risk' },
          { label: 'RIDDOR Reporting', value: '0345 300 9923', sub: 'hse.gov.uk/riddor' },
          { label: 'Derby Diocese Safeguarding', value: 'derby.anglican.org', sub: 'Safeguarding team' },
        ].map(r => (
          <div key={r.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{r.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
