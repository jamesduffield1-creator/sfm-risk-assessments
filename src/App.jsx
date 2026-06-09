import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useRiskAssessments } from './hooks/useRiskAssessments';
import Dashboard from './pages/Dashboard';
import RAList from './pages/RAList';
import RAEditor from './pages/RAEditor';
import RAPreview from './pages/RAPreview';
import StaffSettings from './pages/StaffSettings';
import RAWizard from './pages/RAWizard';
import LegislationHub from './pages/LegislationHub';

function AppShell() {
  const { isAdmin, logout } = useAuth();
  const ra = useRiskAssessments();
  const [page, setPage] = useState('dashboard');   // dashboard | list | edit | preview | settings
  const [activeRA, setActiveRA] = useState(null);
  const [previewRA, setPreviewRA] = useState(null);
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState(null); // null | 'active' | 'draft' | 'needs_review'
  const [filterFlag, setFilterFlag] = useState(null);    // null | 'overdue' | 'high_critical'
  const [showWizard, setShowWizard] = useState(false);

  const nav = (p, data) => {
    setPage(p);
    if (data?.ra)      setActiveRA(data.ra);
    if (data?.preview) setPreviewRA(data.preview);
  };

  const churchName = ra.settings?.church_name || 'St Francis Mackworth';

  if (page === 'preview' && previewRA) {
    return <RAPreview ra={previewRA} staff={ra.staff} settings={ra.settings} onBack={() => setPage('list')} />;
  }

  if (page === 'edit' && activeRA) {
    return (
      <RAEditor
        ra={activeRA}
        staff={ra.staff}
        isAdmin={isAdmin}
        saving={ra.saving}
        onSave={async (updated) => { await ra.upsertRA(updated); nav('list'); }}
        onPreview={(r) => nav('preview', { preview: r })}
        onBack={() => nav('list')}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EB', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Top nav */}
      <nav style={{ background: '#1A3D2B', color: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '2px 0 16px rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#C8952E', fontSize: 18, lineHeight: 1 }}>✝</span>
            <div>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block' }}>
                {churchName}
              </span>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.92)', marginTop: 1, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.01em' }}>Risk Assessment Manager</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[
              { key: 'dashboard',   label: 'Dashboard' },
              { key: 'list',        label: 'Assessments' },
              { key: 'legislation', label: 'Legislation' },
              ...(isAdmin ? [{ key: 'settings', label: 'Staff & Settings' }] : []),
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setPage(key)} style={{
                background: 'transparent',
                color: page === key ? '#fff' : 'rgba(255,255,255,.55)',
                border: 'none',
                borderBottom: page === key ? '2px solid #C8952E' : '2px solid transparent',
                padding: '0 15px', height: 60,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
            {ra.saving && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Saving…</span>}
            {isAdmin
              ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, background: 'rgba(200,149,46,.2)', color: '#C8952E', border: '1px solid rgba(200,149,46,.35)', borderRadius: 4, padding: '3px 9px', fontWeight: 700, letterSpacing: '0.05em' }}>ADMIN</span>
                  <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Log out</button>
                </div>
              : <AdminLoginButton />
            }
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 80px' }}>
        {page === 'dashboard' && (
          <Dashboard
            stats={ra.stats}
            assessments={ra.assessments}
            staff={ra.staff}
            settings={ra.settings}
            isAdmin={isAdmin}
            onViewList={() => setPage('list')}
            onViewListFiltered={(status, flag) => { setFilterStatus(status); setFilterFlag(flag); setPage('list'); }}
            onEditRA={(r) => nav('edit', { ra: r })}
            onPreviewRA={(r) => nav('preview', { preview: r })}
          />
        )}
        {page === 'list' && (
          <RAList
            assessments={ra.assessments}
            filterCat={filterCat}
            setFilterCat={setFilterCat}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterFlag={filterFlag}
            setFilterFlag={setFilterFlag}
            isAdmin={isAdmin}
            saving={ra.saving}
            onEdit={(r) => nav('edit', { ra: r })}
            onPreview={(r) => nav('preview', { preview: r })}
            onDelete={ra.deleteRA}
            onDuplicate={ra.duplicateRA}
            onMarkReviewed={(id, newDate) => {
              const updated = ra.assessments.find(a => a.id === id);
              if (updated) ra.upsertRA({ ...updated, status: 'active', reviewDate: newDate, version: (updated.version || 1) + 1 });
            }}
            onNew={() => setShowWizard(true)}
            onFromTemplate={(t) => nav('edit', { ra: fromTemplate(t) })}
          />
        )}
        {page === 'legislation' && (
          <LegislationHub isAdmin={isAdmin} />
        )}
        {page === 'settings' && isAdmin && (
          <StaffSettings
            staff={ra.staff}
            settings={ra.settings}
            assessments={ra.assessments}
            onSaveStaff={ra.updateStaff}
            onSaveSettings={ra.updateSettings}
            onImport={ra.importAssessments}
            onSyncToSheets={ra.syncAllToSheets}
            sheetsEnabled={!!(import.meta.env.VITE_SHEET_ID && import.meta.env.VITE_SHEETS_API_KEY)}
            saving={ra.saving}
          />
        )}
      </div>

      {showWizard && (
        <RAWizard
          onConfirm={(ra) => { setShowWizard(false); nav('edit', { ra }); }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

function AdminLoginButton() {
  const [show, setShow] = useState(false);
  const { login, error, setError } = useAuth();
  const [pw, setPw] = useState('');

  if (!show) return (
    <button onClick={() => setShow(true)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
      Admin login
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        type="password" placeholder="Admin password" value={pw}
        onChange={e => { setPw(e.target.value); setError(''); }}
        onKeyDown={e => { if (e.key === 'Enter') { login(pw); setPw(''); } }}
        style={{ padding: '5px 10px', borderRadius: 6, border: error ? '1px solid #D4A0A6' : '1px solid rgba(255,255,255,.2)', background: 'rgba(0,0,0,.25)', color: '#fff', fontSize: 12, width: 160, fontFamily: 'inherit', outline: 'none' }}
        autoFocus
      />
      <button onClick={() => { login(pw); setPw(''); }} style={{ background: '#C8952E', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter</button>
      <button onClick={() => { setShow(false); setError(''); setPw(''); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 16 }}>✕</button>
    </div>
  );
}

export function blankRA() {
  const reviewDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })();
  return {
    id: 'ra_' + Date.now(), ref: '', name: '', category: '', location: '',
    legislation: '', reviewMonths: 12, whoAtRisk: [],
    involvesChildren: false, involvesVulnerableAdults: false,
    involvesFood: false, isOutdoor: false, hazards: [],
    status: 'draft', version: 1,
    assessedBy: '', assessedDate: new Date().toISOString().slice(0, 10), reviewDate,
    approvedBy: '', pccNoted: '', vicarSignoff: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export function fromTemplate(t) {
  const months = t.reviewMonths || 12;
  const reviewDate = months > 0 ? (() => {
    const d = new Date(); d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  })() : '';
  return {
    ...t, id: 'ra_' + Date.now(), status: 'draft', version: 1,
    assessedBy: '', assessedDate: new Date().toISOString().slice(0, 10),
    reviewDate, approvedBy: '', pccNoted: '', vicarSignoff: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
