import { useState } from 'react';
import { getRiskLevel } from '../data/riskData';

const CHURCH = 'St Francis Mackworth';

function generateHTML(ra, settings) {
  const churchName = settings?.church_name || CHURCH;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const rc = (l, s) => {
    const score = l * s;
    if (score <= 2) return { bg: '#dcfce7', color: '#15803d', label: 'Low' };
    if (score <= 4) return { bg: '#fef3c7', color: '#b45309', label: 'Medium' };
    if (score <= 6) return { bg: '#fee2e2', color: '#dc2626', label: 'High' };
    return { bg: '#ede9fe', color: '#7c3aed', label: 'Critical' };
  };

  const metaRows = [
    ['Assessed by', ra.assessedBy || '[Name]'],
    ['Date assessed', ra.assessedDate ? new Date(ra.assessedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '[Date]'],
    ['Approved by', ra.approvedBy || '—'],
    ['Review date', ra.reviewDate ? new Date(ra.reviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '[Date]'],
    ['Who might be harmed', (ra.whoAtRisk || []).join(', ') || '—'],
    ['PCC noted', ra.pccNoted ? new Date(ra.pccNoted).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
    ['Vicar sign-off', ra.vicarSignoff || '—'],
  ];

  const hazardRows = (ra.hazards || []).map((hz, i) => {
    const r = rc(hz.likelihood, hz.severity);
    return `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top">${hz.hazard || ''}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top">${hz.who || ''}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top">${hz.existingControls || ''}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;vertical-align:top">${hz.likelihood}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;vertical-align:top">${hz.severity}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top;text-align:center">
        <span style="background:${r.bg};color:${r.color};padding:2px 6px;border-radius:3px;font-weight:700;font-size:11px;white-space:nowrap">${hz.likelihood * hz.severity} — ${r.label}</span>
      </td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top">${hz.additionalControls || '—'}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top">${hz.owner || ''}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top;white-space:nowrap">${hz.deadline || '—'}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;vertical-align:top">&#9744;</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${ra.ref} — ${ra.name} — Risk Assessment</title>
<style>
  @page { size: A3 landscape; margin: 12mm; }
  @media print { body{margin:0} .no-print{display:none!important} tr{page-break-inside:avoid} thead{display:table-header-group} }
  body{font-family:Georgia,serif;color:#0f172a;margin:0;padding:0;background:#fff}
  .page{max-width:1200px;margin:0 auto;padding:32px 32px 50px}
  h1{margin:0 0 6px;font-size:24px;font-weight:700}
  table{width:100%;border-collapse:collapse}
  th{background:#0f172a;color:#fff;padding:8px;text-align:left;font-size:11px;font-weight:600}
  .print-btn{position:fixed;bottom:20px;right:20px;background:#0f172a;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:Georgia,serif}
</style></head><body>
<div class="page">
  <div style="border-bottom:3px solid #0f172a;padding-bottom:18px;margin-bottom:24px">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;margin-bottom:6px;font-family:Arial,sans-serif">${churchName} — Risk Assessment · Ref: ${ra.ref || '—'}</div>
    <h1>${ra.name || 'Untitled Assessment'}</h1>
    <div style="font-size:13px;color:#475569">${ra.category} · ${ra.location}</div>
    <div style="font-size:12px;color:#64748b;margin-top:6px">Legislation: ${ra.legislation}</div>
  </div>
  <table style="margin-bottom:24px;font-size:13px"><tbody>
    ${metaRows.map(([k, v]) => `<tr><td style="font-weight:700;padding:5px 16px 5px 0;color:#374151;width:160px;vertical-align:top">${k}</td><td style="padding:5px 0;color:#1e293b">${v}</td></tr>`).join('')}
  </tbody></table>
  <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap">
    <span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700">Low (1–2)</span>
    <span style="background:#fef3c7;color:#b45309;border:1px solid #fcd34d;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700">Medium (3–4)</span>
    <span style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700">High (6)</span>
    <span style="background:#ede9fe;color:#7c3aed;border:1px solid #c4b5fd;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700">Critical (9)</span>
  </div>
  <table><thead><tr>
    <th style="width:14%">Hazard</th><th style="width:10%">Who at Risk</th><th style="width:16%">Existing Controls</th>
    <th style="width:3%">L</th><th style="width:3%">S</th><th style="width:8%">Risk</th>
    <th style="width:15%">Additional Controls</th><th style="width:10%">Owner</th><th style="width:8%">Deadline</th><th style="width:4%">✓</th>
  </tr></thead><tbody>${hazardRows}</tbody></table>
  <!-- Signature block -->
  <div style="margin-top:32px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
    <div style="background:#0f172a;color:#fff;padding:8px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,sans-serif">Sign-Off</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div style="padding:16px;border-right:1px solid #e2e8f0">
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;font-family:Arial,sans-serif">Assessor</div>
        <div style="font-size:12px;color:#374151;margin-bottom:12px">Name: <strong>${ra.assessedBy || '________________________________'}</strong></div>
        <div style="font-size:12px;color:#374151;margin-bottom:12px">Date: ${ra.assessedDate ? new Date(ra.assessedDate).toLocaleDateString('en-GB') : '________________________________'}</div>
        <div style="font-size:12px;color:#374151">Signature: ________________________________</div>
      </div>
      <div style="padding:16px">
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;font-family:Arial,sans-serif">Approved By (Vicar / Operations Manager)</div>
        <div style="font-size:12px;color:#374151;margin-bottom:12px">Name: <strong>${ra.approvedBy || '________________________________'}</strong></div>
        <div style="font-size:12px;color:#374151;margin-bottom:12px">Date: ________________________________</div>
        <div style="font-size:12px;color:#374151">Signature: ________________________________</div>
      </div>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:10px 16px;display:flex;gap:32px;font-size:12px">
      <span><strong>Next review date:</strong> ${ra.reviewDate ? new Date(ra.reviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '________________'}</span>
      <span><strong>PCC noted:</strong> ${ra.pccNoted ? new Date(ra.pccNoted).toLocaleDateString('en-GB') : '________________'}</span>
      <span><strong>Vicar sign-off:</strong> ${ra.vicarSignoff || '________________'}</span>
    </div>
  </div>
  <div style="border-top:1px solid #e2e8f0;margin-top:20px;padding-top:12px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8">
    <span>${churchName} · Version ${ra.version || 1} · Printed ${today}</span>
    <span>Ecclesiastical Risk Advice: 0345 600 7531 · HSE: hse.gov.uk/simple-health-safety/risk/</span>
  </div>
</div>
<button class="print-btn no-print" onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`;
}

export default function RAPreview({ ra, settings, onBack, shared = false }) {
  const [driveStatus, setDriveStatus] = useState('idle');
  const [driveLink, setDriveLink] = useState('');
  const [copied, setCopied] = useState(false);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const churchName = settings?.church_name || CHURCH;
  const filename = `${ra.ref || 'RA'}-${(ra.name || 'Risk-Assessment').replace(/[^a-zA-Z0-9]+/g, '-')}-STF`;

  const openPDF = () => {
    const html = generateHTML(ra, settings);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?view=${ra.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      window.prompt('Copy this read-only link:', url);
    }
  };

  const saveToDrive = async () => {
    setDriveStatus('uploading');
    try {
      const html = generateHTML(ra, settings);
      const b64 = btoa(unescape(encodeURIComponent(html)));
      const workerUrl = import.meta.env.VITE_WORKER_URL;
      if (!workerUrl) throw new Error('VITE_WORKER_URL not configured');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 500,
          messages: [{ role: 'user', content: `Save this HTML file to Google Drive. Filename: "${filename}.html". Base64 HTML: ${b64}. Return only the file URL.` }],
          mcp_servers: [{ type: 'url', url: 'https://drivemcp.googleapis.com/mcp/v1', name: 'gdrive' }]
        }),
      });
      const data = await res.json();
      const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
      const match = text.match(/https:\/\/[^\s"'<>]+/);
      setDriveLink(match?.[0] || '');
      setDriveStatus('done');
    } catch (e) { console.error(e); setDriveStatus('error'); }
  };

  const riskColor = (l, s) => {
    const score = l * s;
    if (score <= 2) return { bg: '#dcfce7', color: '#15803d', label: 'Low' };
    if (score <= 4) return { bg: '#fef3c7', color: '#b45309', label: 'Medium' };
    if (score <= 6) return { bg: '#fee2e2', color: '#dc2626', label: 'High' };
    return { bg: '#ede9fe', color: '#7c3aed', label: 'Critical' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EB', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ background: '#1A3D2B', borderBottom: '1px solid rgba(0,0,0,.12)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, flexShrink: 0, position: 'sticky', top: 0, zIndex: 100, boxShadow: '2px 0 16px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {shared
            ? <span style={{ color: '#C8952E', fontSize: 18, lineHeight: 1 }}>✝</span>
            : <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 8 }}>{ra.ref}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.92)', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.01em' }}>{ra.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!shared && (
            <button onClick={copyShareLink} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: copied ? '#C8952E' : 'rgba(255,255,255,.7)', borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? '✓ Link copied' : '🔗 Copy share link'}
            </button>
          )}
          {!shared && driveStatus === 'idle' && (
            <button onClick={saveToDrive} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#C8952E', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              📂 Save to Google Drive
            </button>
          )}
          {driveStatus === 'uploading' && <span style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', background: 'rgba(0,0,0,.25)', borderRadius: 7, padding: '8px 16px' }}>Saving to Drive…</span>}
          {driveStatus === 'done' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: '#EAF4EE', color: '#1A5C38', borderRadius: 7, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>
              {driveLink && <a href={driveLink} target="_blank" rel="noreferrer" style={{ color: '#C8952E', fontSize: 13 }}>Open ↗</a>}
            </div>
          )}
          {driveStatus === 'error' && <button onClick={saveToDrive} style={{ background: '#FAF0F1', color: '#8B2430', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Drive failed — retry</button>}
          <button onClick={openPDF} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FEFEFC', color: '#1A3D2B', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🖨 Open as PDF
          </button>
        </div>
      </div>

      {/* Document */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', background: '#fff', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: '#0f172a', padding: '28px 36px 22px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#475569', marginBottom: 8, fontFamily: 'Arial, sans-serif' }}>
              {churchName} — Risk Assessment · Ref: {ra.ref || '—'}
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>{ra.name || 'Untitled'}</h1>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{ra.category} · {ra.location}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 5 }}>Legislation: {ra.legislation}</div>
          </div>

          <div style={{ padding: '28px 36px' }}>
            {/* Meta */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 22, fontSize: 13 }}>
              <tbody>
                {[
                  ['Assessed by', ra.assessedBy || '—'],
                  ['Date assessed', ra.assessedDate ? new Date(ra.assessedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                  ['Approved by', ra.approvedBy || '—'],
                  ['Review date', ra.reviewDate ? new Date(ra.reviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                  ['Who might be harmed', (ra.whoAtRisk || []).join(', ') || '—'],
                  ['PCC noted', ra.pccNoted ? new Date(ra.pccNoted).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                  ['Vicar sign-off', ra.vicarSignoff || '—'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontWeight: 700, padding: '5px 16px 5px 0', color: '#374151', width: 160, verticalAlign: 'top' }}>{k}</td>
                    <td style={{ padding: '5px 0', color: '#1e293b' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Risk key */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
              {[['Low (1–2)','#dcfce7','#15803d','#86efac'],['Medium (3–4)','#fef3c7','#b45309','#fcd34d'],['High (6)','#fee2e2','#dc2626','#fca5a5'],['Critical (9)','#ede9fe','#7c3aed','#c4b5fd']].map(([label,bg,color,border]) => (
                <span key={label} style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{label}</span>
              ))}
            </div>

            {/* Hazards table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Hazard','Who at Risk','Existing Controls','L','S','Risk','Additional Controls','Owner','Deadline','✓'].map((h, i) => (
                      <th key={i} style={{ background: '#0f172a', color: '#fff', padding: '9px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(ra.hazards || []).map((hz, i) => {
                    const r = riskColor(hz.likelihood, hz.severity);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top', maxWidth: 160 }}>{hz.hazard}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top' }}>{hz.who}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top' }}>{hz.existingControls}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top', textAlign: 'center' }}>{hz.likelihood}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top', textAlign: 'center' }}>{hz.severity}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                          <span style={{ background: r.bg, color: r.color, padding: '2px 6px', borderRadius: 3, fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>{hz.likelihood * hz.severity} — {r.label}</span>
                        </td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top' }}>{hz.additionalControls || '—'}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top' }}>{hz.owner}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{hz.deadline || '—'}</td>
                        <td style={{ padding: 8, border: '1px solid #e2e8f0', verticalAlign: 'top', textAlign: 'center', fontSize: 14 }}>☐</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature block */}
            <div style={{ marginTop: 28, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', color: '#fff', padding: '8px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Sign-Off</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: 16, borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Assessor</div>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>Name: <strong>{ra.assessedBy || '________________________________'}</strong></div>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>Date: {ra.assessedDate ? new Date(ra.assessedDate).toLocaleDateString('en-GB') : '________________________________'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Signature: ________________________________</div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Approved By (Vicar / Operations Manager)</div>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>Name: <strong>{ra.approvedBy || '________________________________'}</strong></div>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>Date: ________________________________</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Signature: ________________________________</div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', gap: 28, fontSize: 12, flexWrap: 'wrap' }}>
                <span><strong>Next review date:</strong> {ra.reviewDate ? new Date(ra.reviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '________________'}</span>
                <span><strong>PCC noted:</strong> {ra.pccNoted ? new Date(ra.pccNoted).toLocaleDateString('en-GB') : '________________'}</span>
                <span><strong>Vicar sign-off:</strong> {ra.vicarSignoff || '________________'}</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 20, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>{churchName} · Version {ra.version || 1} · Printed {today}</span>
              <span>Ecclesiastical Risk Advice: 0345 600 7531 · HSE: hse.gov.uk/simple-health-safety/risk/</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
