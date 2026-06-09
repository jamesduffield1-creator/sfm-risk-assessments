import { useState, useEffect } from 'react';

const LEG_CHECKED_KEY = 'sfm_legislation_checked';

// ─── Legislation data ──────────────────────────────────────────────────────────
const LEGISLATION = [
  // ── Health & Safety ──────────────────────────────────────────────────────────
  {
    id: 'hswa',
    ref: 'HSWA 1974',
    name: 'Health and Safety at Work Act 1974',
    category: 'Health & Safety',
    summary: 'The foundational UK health and safety law. Requires employers to ensure, so far as reasonably practicable, the health, safety and welfare of all employees and others affected by their work.',
    stfNote: 'Applies to all STF activities. Underpins every risk assessment we produce. The "so far as reasonably practicable" standard means balancing risk against the cost and effort of precautions.',
    link: 'https://www.legislation.gov.uk/ukpga/1974/37/contents',
    linkLabel: 'legislation.gov.uk',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'mhswr',
    ref: 'MHSWR 1999',
    name: 'Management of Health and Safety at Work Regulations 1999',
    category: 'Health & Safety',
    summary: 'Requires employers to carry out risk assessments, implement preventive measures, appoint competent persons, and provide health and safety information and training.',
    stfNote: 'The specific legal basis for our risk assessment programme. All assessments in this app fulfil the MHSWR requirement to document significant findings.',
    link: 'https://www.legislation.gov.uk/uksi/1999/3242/contents',
    linkLabel: 'legislation.gov.uk',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'riddor',
    ref: 'RIDDOR 2013',
    name: 'Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013',
    category: 'Health & Safety',
    summary: 'Requires employers to report certain workplace accidents, occupational diseases, and dangerous occurrences to the HSE.',
    stfNote: 'STF must report: deaths, specified injuries (fractures, amputations, burns covering >10% of body), injuries resulting in more than 7 days off work, and dangerous occurrences. Report online at hse.gov.uk/riddor or by phone: 0345 300 9923.',
    link: 'https://www.hse.gov.uk/riddor/',
    linkLabel: 'hse.gov.uk/riddor',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'firstaid',
    ref: 'First Aid Regs 1981',
    name: 'Health and Safety (First Aid) Regulations 1981',
    category: 'Health & Safety',
    summary: 'Requires employers to provide adequate and appropriate first aid equipment, facilities and trained personnel.',
    stfNote: 'STF must have at least one qualified First Aider on site for all gatherings. First aid kits must be adequately stocked and inspected regularly. Nearest AED location should be known to all Welcome Team leads.',
    link: 'https://www.hse.gov.uk/firstaid/index.htm',
    linkLabel: 'hse.gov.uk/firstaid',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'wahr',
    ref: 'WAHR 2005',
    name: 'Work at Height Regulations 2005',
    category: 'Health & Safety',
    summary: 'Requires that all work at height is properly planned, supervised and carried out by competent people using the right equipment.',
    stfNote: 'Applies whenever STF volunteers change lightbulbs, put up decorations, clean windows, or carry out any task above ground level. Even standing on a chair counts. Always use appropriate equipment and have a second person present.',
    link: 'https://www.hse.gov.uk/work-at-height/',
    linkLabel: 'hse.gov.uk/work-at-height',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'manual',
    ref: 'MHOR 1992',
    name: 'Manual Handling Operations Regulations 1992',
    category: 'Health & Safety',
    summary: 'Requires employers to avoid hazardous manual handling where reasonably practicable, and to assess and reduce the risk of injury from unavoidable manual handling.',
    stfNote: 'Relevant when volunteers move chairs, set up staging, carry equipment or handle deliveries. Trolleys should be available. No volunteer should lift heavy items alone.',
    link: 'https://www.hse.gov.uk/pubns/indg143.pdf',
    linkLabel: 'HSE guidance (PDF)',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'coshh',
    ref: 'COSHH 2002',
    name: 'Control of Substances Hazardous to Health Regulations 2002',
    category: 'Health & Safety',
    summary: 'Requires employers to control substances that are hazardous to health, including cleaning products, chemicals and biological agents.',
    stfNote: 'Applies to cleaning products stored and used at STF. COSHH data sheets should be available for all chemical products. Products must be stored safely and used as directed.',
    link: 'https://www.hse.gov.uk/coshh/',
    linkLabel: 'hse.gov.uk/coshh',
    status: 'current',
    lastChecked: '2025-01-01',
  },

  // ── Fire Safety ───────────────────────────────────────────────────────────────
  {
    id: 'rro',
    ref: 'RRO 2005',
    name: 'Regulatory Reform (Fire Safety) Order 2005',
    category: 'Fire Safety',
    summary: 'Places a duty on the "responsible person" (usually the employer or building owner) to carry out a fire risk assessment and implement appropriate fire safety measures.',
    stfNote: 'STF must have a current Fire Risk Assessment, maintain fire exits and extinguishers, train staff in evacuation procedures, and conduct an annual fire drill. The Operations Manager holds primary responsibility.',
    link: 'https://www.legislation.gov.uk/uksi/2005/1541/contents',
    linkLabel: 'legislation.gov.uk',
    status: 'current',
    lastChecked: '2025-01-01',
    alert: 'Fire Safety (England) Regulations 2022 introduced additional requirements for multi-occupied residential buildings — check whether these apply to any STF-managed premises.',
  },

  // ── Food Safety ───────────────────────────────────────────────────────────────
  {
    id: 'fsa',
    ref: 'FSA 1990',
    name: 'Food Safety Act 1990',
    category: 'Food Safety',
    summary: 'The primary food safety legislation in England. Makes it an offence to sell food that is unsafe, falsely described, or not of the quality demanded.',
    stfNote: 'Applies to all food served at STF events and activities, including refreshments after services and toddler group snacks.',
    link: 'https://www.legislation.gov.uk/ukpga/1990/16/contents',
    linkLabel: 'legislation.gov.uk',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'foodhygiene',
    ref: 'FHR 2006',
    name: 'Food Hygiene (England) Regulations 2006',
    category: 'Food Safety',
    summary: 'Implements EU food hygiene law in England. Requires food businesses to register with their local authority and implement HACCP-based food safety management.',
    stfNote: 'If STF prepares and serves food regularly, it may need to register as a food business with Derby City Council. Contact Environmental Health to confirm current status.',
    link: 'https://www.food.gov.uk/business-guidance/registration-and-approval',
    linkLabel: 'food.gov.uk',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'natashas',
    ref: "Natasha's Law 2021",
    name: "Food Information (Amendment) (England) Regulations 2021 (Natasha's Law)",
    category: 'Food Safety',
    summary: 'Requires full ingredient and allergen labelling on all food pre-packed for direct sale (PPDS) — food packed on the premises where it is sold.',
    stfNote: "Applies to any food STF prepares and packages on site for sale or distribution — e.g. pre-packed cakes at events. All 14 major allergens must be declared. Volunteers must be trained in allergen awareness.",
    link: 'https://www.food.gov.uk/business-guidance/natashas-law',
    linkLabel: 'food.gov.uk/natashas-law',
    status: 'current',
    lastChecked: '2025-01-01',
    alert: "Natasha's Law came into force October 2021. If STF sells or gives away pre-packed food, allergen labelling is a legal requirement — not optional.",
  },

  // ── Safeguarding ──────────────────────────────────────────────────────────────
  {
    id: 'svga',
    ref: 'SVGA 2006',
    name: 'Safeguarding Vulnerable Groups Act 2006',
    category: 'Safeguarding',
    summary: 'Established the barring scheme for those who should not work with children or vulnerable adults. Now administered by the Disclosure and Barring Service (DBS).',
    stfNote: 'STF must carry out DBS checks on all staff and volunteers undertaking regulated activity with children or vulnerable adults. The PSO maintains the DBS register.',
    link: 'https://www.gov.uk/government/organisations/disclosure-and-barring-service',
    linkLabel: 'DBS — gov.uk',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'children',
    ref: 'Children Acts 1989/2004',
    name: 'Children Act 1989 and Children Act 2004',
    category: 'Safeguarding',
    summary: "Establishes the legal framework for child protection in England. The 2004 Act introduced the 'Every Child Matters' framework and strengthened inter-agency cooperation.",
    stfNote: 'STF must have a Safeguarding Policy compliant with the Church of England national policy. All leaders working with children must complete Foundation Safeguarding Training. Any concern must be reported to the PSO.',
    link: 'https://www.legislation.gov.uk/ukpga/2004/31/contents',
    linkLabel: 'legislation.gov.uk',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'coesafeguarding',
    ref: 'CoE Safeguarding',
    name: 'Church of England Safeguarding Policy — Promoting a Safer Church',
    category: 'Safeguarding',
    summary: "The Church of England's national safeguarding policy, updated regularly. Sets out expectations for all parishes regarding safer recruitment, training, responding to concerns, and culture.",
    stfNote: 'STF must comply with the national CoE safeguarding policy as adopted by Derby Diocese. The PSO is Joanne Baillie. Annual safeguarding dashboard submitted to Diocese.',
    link: 'https://www.churchofengland.org/safeguarding/safeguarding-e-manual',
    linkLabel: 'churchofengland.org/safeguarding',
    status: 'current',
    lastChecked: '2025-01-01',
    alert: 'The CoE Safeguarding e-manual is updated regularly. Check for updates annually, especially before the Diocese safeguarding dashboard submission.',
  },
  {
    id: 'derbydiocese',
    ref: 'Derby Diocese',
    name: 'Derby Diocese Safeguarding Policy and Procedures',
    category: 'Safeguarding',
    summary: "Derby Diocese's local safeguarding policy, which supplements the national CoE policy with Diocese-specific procedures and contacts.",
    stfNote: 'The Derby Diocese Safeguarding Team should be the first point of contact for any serious safeguarding concern. Contact details held by the PSO and Vicar.',
    link: 'https://www.derby.anglican.org/en/safeguarding.html',
    linkLabel: 'derby.anglican.org/safeguarding',
    status: 'current',
    lastChecked: '2025-01-01',
  },

  // ── Data & Privacy ────────────────────────────────────────────────────────────
  {
    id: 'ukgdpr',
    ref: 'UK GDPR 2021',
    name: 'UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018',
    category: 'Data & Privacy',
    summary: 'Regulates how organisations collect, store, use and share personal data. The UK GDPR retained EU GDPR principles after Brexit.',
    stfNote: 'STF must have a Privacy Notice, maintain records of processing activities, respond to subject access requests within one month, and report data breaches to the ICO within 72 hours. ChurchSuite is the primary data platform.',
    link: 'https://ico.org.uk/for-organisations/guide-to-data-protection/',
    linkLabel: 'ico.org.uk',
    status: 'current',
    lastChecked: '2025-01-01',
  },

  // ── Events & Licensing ────────────────────────────────────────────────────────
  {
    id: 'licensing',
    ref: 'Licensing Act 2003',
    name: 'Licensing Act 2003',
    category: 'Events & Licensing',
    summary: 'Regulates licensable activities including the sale of alcohol, regulated entertainment (live or recorded music to an audience), and late night refreshment.',
    stfNote: 'STF must check licensing requirements before any event involving alcohol, live music, or late-night refreshment. A Temporary Event Notice (TEN) must be submitted to Derby City Council at least 10 working days before the event.',
    link: 'https://www.gov.uk/guidance/alcohol-licensing',
    linkLabel: 'gov.uk/alcohol-licensing',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'fireworks',
    ref: 'Fireworks Regs 2004',
    name: 'Fireworks Regulations 2004',
    category: 'Events & Licensing',
    summary: 'Controls the supply, possession and use of fireworks, including minimum safety distances and restrictions on use at night.',
    stfNote: 'STF must use a competent operator for any fireworks display. Safety distances must be observed. A specific risk assessment (E8 template) is required for bonfire/fireworks events.',
    link: 'https://www.hse.gov.uk/explosives/fireworks/use-fireworks-safely.htm',
    linkLabel: 'hse.gov.uk/fireworks',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'cdm',
    ref: 'CDM 2015',
    name: 'Construction (Design and Management) Regulations 2015',
    category: 'Maintenance',
    summary: 'Places duties on clients, designers and contractors to plan, manage and monitor construction projects to ensure health and safety risks are properly controlled.',
    stfNote: 'Applies to any building or refurbishment work at STF. For notifiable projects (lasting more than 30 working days with more than 20 workers, or exceeding 500 person-days), a Principal Designer and Principal Contractor must be appointed.',
    link: 'https://www.hse.gov.uk/construction/cdm/2015/index.htm',
    linkLabel: 'hse.gov.uk/cdm',
    status: 'current',
    lastChecked: '2025-01-01',
  },
  {
    id: 'asbestos',
    ref: 'CAR 2012',
    name: 'Control of Asbestos Regulations 2012',
    category: 'Maintenance',
    summary: 'Requires the management of asbestos in non-domestic premises, including maintaining an asbestos register and informing contractors of its location.',
    stfNote: 'STF must have an up-to-date asbestos management survey. The register must be shared with all contractors before works begin. If asbestos is found or disturbed, works must stop immediately.',
    link: 'https://www.hse.gov.uk/asbestos/',
    linkLabel: 'hse.gov.uk/asbestos',
    status: 'current',
    lastChecked: '2025-01-01',
  },
];

const CATEGORIES = ['All', 'Health & Safety', 'Fire Safety', 'Food Safety', 'Safeguarding', 'Data & Privacy', 'Events & Licensing', 'Maintenance'];

const CATEGORY_COLORS = {
  'Health & Safety':    '#0E6B82',
  'Fire Safety':        '#8B2430',
  'Food Safety':        '#1A5C38',
  'Safeguarding':       '#452870',
  'Data & Privacy':     '#8B5B18',
  'Events & Licensing': '#1A3D2B',
  'Maintenance':        '#9A6B1E',
};

const KEY_RESOURCES = [
  {
    name: 'HSE E-bulletin (free)',
    description: 'Sign up for free email updates on health & safety regulatory changes from the Health and Safety Executive.',
    link: 'https://www.hse.gov.uk/news/subscribe/',
    icon: '📋',
  },
  {
    name: 'Ecclesiastical Insurance',
    description: 'Risk advice line for churches: 0345 600 7531 (Mon–Fri 9–5). Free specialist guidance on church-specific risk and compliance.',
    link: 'https://www.ecclesiastical.com/risk-management/',
    icon: '⛪',
  },
  {
    name: 'Derby Diocese Safeguarding',
    description: 'Derby Diocese safeguarding team — first point of contact for safeguarding concerns and policy updates.',
    link: 'https://www.derby.anglican.org/en/safeguarding.html',
    icon: '🛡',
  },
  {
    name: 'Church of England H&S Guidance',
    description: 'National CoE health, safety and fire guidance for parishes, updated regularly by the national church.',
    link: 'https://www.churchofengland.org/resources/property-and-buildings/health-and-safety',
    icon: '✝',
  },
  {
    name: 'Food Standards Agency',
    description: 'Guidance for food businesses including allergen labelling, registration and hygiene requirements.',
    link: 'https://www.food.gov.uk/business-guidance',
    icon: '🍽',
  },
  {
    name: 'Information Commissioner (ICO)',
    description: 'Guidance on UK GDPR, data protection and reporting data breaches.',
    link: 'https://ico.org.uk/for-organisations/',
    icon: '🔒',
  },
];

export default function LegislationHub({ isAdmin }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [checkedDates, setCheckedDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LEG_CHECKED_KEY)) || {}; } catch { return {}; }
  });

  const markChecked = (id) => {
    const updated = { ...checkedDates, [id]: new Date().toISOString().slice(0, 10) };
    setCheckedDates(updated);
    try { localStorage.setItem(LEG_CHECKED_KEY, JSON.stringify(updated)); } catch (_) {}
  };

  const filtered = LEGISLATION.filter(l => {
    if (activeCategory !== 'All' && l.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.ref.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q);
    }
    return true;
  });

  const alertCount = LEGISLATION.filter(l => l.alert).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 600, color: '#1C1C1A', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.01em' }}>Legislation & Compliance</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#8C887E' }}>
          {LEGISLATION.length} pieces of legislation · {alertCount} require attention · Links open official sources
        </p>
      </div>

      {/* Alerts banner */}
      {LEGISLATION.filter(l => l.alert).length > 0 && (
        <div style={{ background: '#FDF3E4', border: '1px solid #D4AA6A', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#8B5B18', marginBottom: 8, fontSize: 13 }}>⚠ Items requiring attention</div>
          {LEGISLATION.filter(l => l.alert).map(l => (
            <div key={l.id} style={{ fontSize: 13, color: '#7A4A10', marginBottom: 4 }}>
              <strong>{l.ref}:</strong> {l.alert}
            </div>
          ))}
        </div>
      )}

      {/* Category filters + search */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)} style={{
            padding: '6px 13px', borderRadius: 6, border: '1px solid',
            borderColor: activeCategory === c ? (CATEGORY_COLORS[c] || '#1C1C1A') : '#E4DDD2',
            background: activeCategory === c ? (CATEGORY_COLORS[c] || '#1C1C1A') : '#FEFEFC',
            color: activeCategory === c ? '#FEFEFC' : '#5C5852',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>{c}</button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search legislation…"
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 6, border: '1px solid #E4DDD2', fontSize: 13, width: 220, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* Legislation cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
        {filtered.map(l => {
          const isOpen = expanded === l.id;
          const color = CATEGORY_COLORS[l.category] || '#8C887E';
          const lastChecked = checkedDates[l.id] || l.lastChecked;

          return (
            <div key={l.id} style={{ background: '#FEFEFC', border: '1px solid', borderColor: l.alert ? '#D4AA6A' : '#E4DDD2', borderRadius: 10, overflow: 'hidden' }}>
              {/* Card header — always visible */}
              <div onClick={() => setExpanded(isOpen ? null : l.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}>
                <div style={{ width: 4, flexShrink: 0, alignSelf: 'stretch', borderRadius: 2, background: color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'Arial, sans-serif', minWidth: 90 }}>{l.ref}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A' }}>{l.name}</span>
                    {l.alert && <span style={{ fontSize: 11, background: '#FDF3E4', color: '#8B5B18', border: '1px solid #D4AA6A', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>⚠ Note</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#8C887E', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ background: color + '18', color, border: `1px solid ${color}33`, borderRadius: 4, padding: '1px 7px', fontWeight: 600 }}>{l.category}</span>
                    <span>Last checked: {new Date(lastChecked).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <span style={{ fontSize: 16, color: '#C8C2B8', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px 20px 20px' }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8C887E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>What it requires</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#2A2A28', lineHeight: 1.6 }}>{l.summary}</p>
                  </div>
                  <div style={{ marginBottom: 14, background: '#EAF4EE', border: '1px solid #9BCAAC', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1A5C38', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>What this means for STF</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#1A4E2C', lineHeight: 1.6 }}>{l.stfNote}</p>
                  </div>
                  {l.alert && (
                    <div style={{ marginBottom: 14, background: '#FDF3E4', border: '1px solid #D4AA6A', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5B18', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>⚠ Action needed</div>
                      <p style={{ margin: 0, fontSize: 13, color: '#7A4A10', lineHeight: 1.6 }}>{l.alert}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <a href={l.link} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1C1C1A', color: '#FEFEFC', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      View official source: {l.linkLabel} ↗
                    </a>
                    {isAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#8C887E' }}>Mark as checked today:</span>
                        <button onClick={() => markChecked(l.id)}
                          style={{ background: '#f1f5f9', border: '1px solid #E4DDD2', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#5C5852' }}>
                          ✓ Checked {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key resources */}
      <div style={{ background: '#FEFEFC', border: '1px solid #E4DDD2', borderRadius: 10, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C887E' }}>Key Resources & Contacts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {KEY_RESOURCES.map(r => (
            <a key={r.name} href={r.link} target="_blank" rel="noreferrer"
              style={{ display: 'block', background: '#F5F2EB', border: '1px solid #E4DDD2', borderRadius: 8, padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#C8C2B8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E4DDD2'}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#8C887E', lineHeight: 1.5 }}>{r.description}</div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: '#F5F2EB', borderRadius: 8, fontSize: 12, color: '#C8C2B8' }}>
        <strong>Note:</strong> This hub provides signposting to official sources. Legislation changes — always verify current requirements at the linked official source before relying on them for compliance purposes. Last full review of this hub: January 2025.
      </div>
    </div>
  );
}
