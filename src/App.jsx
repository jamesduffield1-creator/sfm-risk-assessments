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
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Georgia, serif' }}>
      {/* Top nav */}
      <nav style={{ background: '#0f172a', color: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', height: 58, gap: 0 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b', fontFamily: 'Arial, sans-serif' }}>
              {churchName}
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 1 }}>Risk Assessment Manager</div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { key: 'dashboard',   label: 'Dashboard' },
              { key: 'list',        label: 'Assessments' },
              { key: 'legislation', label: 'Legislation' },
              ...(isAdmin ? [{ key: 'settings', label: 'Staff & Settings' }] : []),
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setPage(key)} style={{
                background: page === key ? '#1e293b' : 'transparent',
                color: page === key ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 6, padding: '6px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
            {ra.saving && <span style={{ fontSize: 12, color: '#64748b' }}>Saving…</span>}
            {isAdmin
              ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, background: '#1e3a5f', color: '#60a5fa', borderRadius: 4, padding: '3px 8px', fontWeight: 700 }}>ADMIN</span>
                  <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Log out</button>
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
            onEditRA={(r) => nav('edit', { ra: r })}
            onPreviewRA={(r) => nav('preview', { preview: r })}
          />
        )}
        {page === 'list' && (
          <RAList
            assessments={ra.assessments}
            filterCat={filterCat}
            setFilterCat={setFilterCat}
            isAdmin={isAdmin}
            saving={ra.saving}
            onEdit={(r) => nav('edit', { ra: r })}
            onPreview={(r) => nav('preview', { preview: r })}
            onDelete={ra.deleteRA}
            onDuplicate={ra.duplicateRA}
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
    <button onClick={() => setShow(true)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
      Admin login
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        type="password" placeholder="Admin password" value={pw}
        onChange={e => { setPw(e.target.value); setError(''); }}
        onKeyDown={e => { if (e.key === 'Enter') { login(pw); setPw(''); } }}
        style={{ padding: '5px 10px', borderRadius: 6, border: error ? '1px solid #dc2626' : '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: 12, width: 160, fontFamily: 'inherit', outline: 'none' }}
        autoFocus
      />
      <button onClick={() => { login(pw); setPw(''); }} style={{ background: '#fff', color: '#0f172a', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Enter</button>
      <button onClick={() => { setShow(false); setError(''); setPw(''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
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
