import { getRiskLevel, CATEGORY_COLORS } from '../data/riskData';

const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', system-ui, sans-serif";

function StatCard({ value, label, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 12,
        padding: '18px 20px', cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.18s, transform 0.18s',
        animation: 'fadeUp .35s ease both',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ fontSize: 34, fontWeight: 700, color, lineHeight: 1, fontFamily: serif }}>{value}</div>
      <div style={{ fontSize: 12, color: '#8C887E', marginTop: 6, fontFamily: sans }}>{label}</div>
    </div>
  );
}

function ReviewAlert({ assessments }) {
  const overdue = assessments.filter(a => a.status === 'active' && a.reviewDate && new Date(a.reviewDate) < new Date());
  const soon    = assessments.filter(a => a.status === 'active' && a.reviewDate && (() => { const d = new Date(a.reviewDate) - new Date(); return d > 0 && d < 30*24*60*60*1000; })());

  if (!overdue.length && !soon.length) return null;

  return (
    <div style={{ marginBottom: 24, animation: 'fadeIn .25s ease both' }}>
      {overdue.length > 0 && (
        <div style={{ background: '#FAF0F1', border: '1px solid #D4A0A6', borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, color: '#8B2430', marginBottom: 6, fontSize: 13, fontFamily: sans }}>⚠ {overdue.length} assessment{overdue.length > 1 ? 's' : ''} overdue for review</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {overdue.map(a => (
              <span key={a.id} style={{ background: '#FEFEFC', color: '#8B2430', border: '1px solid #D4A0A6', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{a.ref} — {a.name}</span>
            ))}
          </div>
        </div>
      )}
      {soon.length > 0 && (
        <div style={{ background: '#FDF3E4', border: '1px solid #D4AA6A', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontWeight: 600, color: '#8B5B18', marginBottom: 6, fontSize: 13, fontFamily: sans }}>⚑ {soon.length} assessment{soon.length > 1 ? 's' : ''} due for review within 30 days</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {soon.map(a => (
              <span key={a.id} style={{ background: '#FEFEFC', color: '#8B5B18', border: '1px solid #D4AA6A', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{a.ref} — {a.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ stats, assessments, staff, settings, isAdmin, onViewList, onViewListFiltered, onEditRA, onPreviewRA }) {
  const staffMap = Object.fromEntries((staff || []).map(s => [s.key, s]));

  const keyRoles = [
    { key: 'vicar',        label: 'Vicar' },
    { key: 'ops_manager',  label: 'Operations Manager' },
    { key: 'pso',          label: 'Parish Safeguarding Officer' },
    { key: 'cf_pastor',    label: 'Children & Families Pastor' },
    { key: 'youth_pastor', label: 'Youth Pastor' },
  ];

  const recent = [...assessments]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <div style={{ animation: 'fadeIn .25s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 600, color: '#1C1C1A', fontFamily: serif, letterSpacing: '-0.01em' }}>Dashboard</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#8C887E', fontFamily: sans }}>{settings?.church_name} · {settings?.diocese} · {settings?.network}</p>
      </div>

      <ReviewAlert assessments={assessments} />

      {/* Stats row */}
      <div className="stat-grid">
        <StatCard value={stats.total}        label="Total assessments"            color="#1C1C1A"  onClick={() => onViewListFiltered(null, null)} />
        <StatCard value={stats.active}       label="Active"                       color="#1A5C38"  onClick={() => onViewListFiltered('active', null)} />
        <StatCard value={stats.draft}        label="Draft"                        color="#5C5852"  onClick={() => onViewListFiltered('draft', null)} />
        <StatCard value={stats.needsReview}  label="Needs review"                 color={stats.needsReview  > 0 ? '#8B5B18' : '#1A5C38'} onClick={() => onViewListFiltered('needs_review', null)} />
        <StatCard value={stats.overdue}      label="Overdue review"               color={stats.overdue  > 0 ? '#8B2430' : '#1A5C38'} onClick={() => onViewListFiltered('active', 'overdue')} />
        <StatCard value={stats.highCritical} label="Contain high/critical risks"  color={stats.highCritical > 0 ? '#8B2430' : '#1A5C38'} onClick={() => onViewListFiltered(null, 'high_critical')} />
      </div>

      <div className="two-col-grid">
        {/* By category */}
        <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8C887E', fontFamily: sans }}>By Category</h3>
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: CATEGORY_COLORS[cat] || '#8C887E', opacity: 0.7, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: '#2A2A28', fontFamily: sans }}>{cat}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', fontFamily: serif }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Key staff */}
        <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8C887E', fontFamily: sans }}>Key Contacts</h3>
          {keyRoles.map(({ key, label }) => {
            const person = staffMap[key];
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9, fontSize: 13 }}>
                <span style={{ color: '#8C887E', fontFamily: sans }}>{label}</span>
                <span style={{ fontWeight: 600, color: person?.name && person.name !== 'TBC' ? '#1C1C1A' : '#C8C2B8', fontFamily: sans }}>
                  {person?.name || 'TBC'}
                </span>
              </div>
            );
          })}
          {isAdmin && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E4DDD2' }}>
              <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, color: '#9A6B1E', fontFamily: sans }}>
                Update staff details in Settings →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 12, padding: 22, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8C887E', fontFamily: sans }}>Recently Updated</h3>
        {recent.map(ra => {
          const critCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'Critical').length;
          const highCount = (ra.hazards || []).filter(h => getRiskLevel(h.likelihood, h.severity).label === 'High').length;
          return (
            <div key={ra.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #E4DDD2' }}>
              <div style={{ width: 3, height: 36, borderRadius: 2, background: CATEGORY_COLORS[ra.category] || '#8C887E', opacity: 0.6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', fontFamily: sans }}>{ra.ref} — {ra.name}</div>
                <div style={{ fontSize: 11, color: '#C8C2B8', marginTop: 2, fontFamily: sans }}>{ra.category} · Updated {new Date(ra.updatedAt).toLocaleDateString('en-GB')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {critCount > 0 && <span style={{ background: '#F2EDF8', color: '#452870', border: '1px solid #BDB0D8', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{critCount} critical</span>}
                {highCount > 0 && <span style={{ background: '#FAF0F1', color: '#8B2430', border: '1px solid #D4A0A6', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{highCount} high</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onPreviewRA(ra)} style={{ background: '#F5F2EB', color: '#5C5852', border: '1px solid #E4DDD2', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Preview</button>
                {isAdmin && <button onClick={() => onEditRA(ra)} style={{ background: '#1A3D2B', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>}
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
          <div key={r.label} style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 10, padding: '13px 16px' }}>
            <div style={{ fontSize: 10, color: '#8C887E', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: sans }}>{r.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', fontFamily: serif }}>{r.value}</div>
            <div style={{ fontSize: 11, color: '#C8C2B8', marginTop: 2, fontFamily: sans }}>{r.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
