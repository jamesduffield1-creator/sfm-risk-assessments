// ─── Risk Level Helpers ───────────────────────────────────────────────────────
export const RISK_LEVELS = {
  Low:      { color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  Medium:   { color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  High:     { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  Critical: { color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
};

export function getRiskLevel(likelihood, severity) {
  const score = likelihood * severity;
  if (score <= 2) return { score, label: 'Low',      ...RISK_LEVELS.Low };
  if (score <= 4) return { score, label: 'Medium',   ...RISK_LEVELS.Medium };
  if (score <= 6) return { score, label: 'High',     ...RISK_LEVELS.High };
  return             { score, label: 'Critical', ...RISK_LEVELS.Critical };
}

export const CATEGORY_COLORS = {
  'Premises':           '#0f172a',
  'Regular Activities': '#1e40af',
  'Events':             '#7c3aed',
  'Maintenance':        '#d97706',
  'Operations':         '#0891b2',
};

export const WHO_AT_RISK_OPTIONS = [
  'Congregation members','Volunteers','Children (under 18)',
  'Young people (11–17)','Vulnerable adults','Elderly attendees',
  'Staff','Visitors / public','Contractors','Lone workers',
];

export const HAZARD_BANK = {
  'Trips & Falls': [
    'Worn or unfixed carpet edges, rugs, or doormats',
    'Trailing wires, cables, or leads',
    'Worn, damaged, or uneven steps or stairs',
    'Poor lighting in corridors or stairwells',
    'Missing or defective handrails',
    'Variations in floor level (ramps, thresholds)',
  ],
  'Slips': [
    'Smooth or polished floor surfaces','Wet floors from cleaning or spills',
    'Wet floors from leaking roof or plumbing','Walk-in contaminants (mud, rainwater, ice)',
    'Algae or moss on external paths','Inadequate provision for snow and ice',
  ],
  'Fire': [
    'Accumulations of combustible waste','Blocked or obstructed fire exit routes',
    'Locked or obstructed fire escape doors','Candles left unattended or near combustibles',
    'Faulty or overloaded electrical equipment','Portable heaters in use',
  ],
  'Electricity': [
    'Faulty or damaged fixed wiring','Damaged or unauthorised portable electrical equipment',
    'Faulty extension cables or multi-way adaptors','Electrical equipment not PAT tested',
  ],
  'Manual Handling': [
    'Lifting or carrying heavy or bulky furniture','Moving heavy AV or production equipment',
    'Handling deliveries or donated goods','Manual handling without training or instruction',
  ],
  'Falls from Height': [
    'Changing lightbulbs without appropriate equipment','Cleaning or decorating at height',
    'Putting up displays or decorations at height','Using damaged or inappropriate ladders',
    'Working at height without a second person present',
  ],
  'Safeguarding': [
    'Safeguarding disclosure not escalated promptly','Two-adult rule breach',
    'Unsupervised access to children or vulnerable adults','DBS check not completed before regulated activity',
    'Communication boundary breach (personal social media)',
  ],
  'Food & Allergens': [
    'Allergen cross-contamination (Natasha\'s Law)','Incorrect food storage temperatures',
    'Burns and scalds from hot liquids or equipment','Poor personal hygiene by food handlers',
    'Unsecured or poorly positioned hot water urns',
  ],
  'Security': [
    'Volunteer working alone in the building','Keyholder opening or closing alone',
    'Unauthorised persons gaining access to premises','Threatening or aggressive behaviour',
    'Cash handling without two-person procedure',
  ],
};
// All templates live in src/data/templates.js (ALL_TEMPLATES) — single source of truth.
