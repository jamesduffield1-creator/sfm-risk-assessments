// ─── Hazard Library ───────────────────────────────────────────────────────────
// Each entry pre-fills a complete hazard row in the RA editor.
// Likelihood / Severity use 1–3 scale (1=low, 3=high).
// Admins can add custom entries stored in localStorage under LS_KEY below.

export const HL_LS_KEY = 'sfm_hazard_library_custom';

export const LIBRARY_CATEGORIES = [
  'All',
  'Slips, Trips & Falls',
  'Fire Safety',
  'Electrical Safety',
  'Manual Handling',
  'Work at Height',
  'Safeguarding',
  'Food & Allergens',
  'Crowd & Events',
  'Outdoor & Environment',
  'Health & Wellbeing',
  'Security',
];

export const BUILT_IN_LIBRARY = [

  // ── Slips, Trips & Falls ─────────────────────────────────────────────────
  {
    id: 'slip_wet_entrance',
    category: 'Slips, Trips & Falls',
    hazard: 'Wet floors at building entrances (rain, cleaning)',
    who: 'Congregation, volunteers, visitors',
    existingControls: 'Non-slip matting at all entrances; wet floor signs available; floors inspected before gatherings.',
    likelihood: 2, severity: 2,
    additionalControls: 'Deploy wet floor signs immediately when floors are wet. Inspect entry mats for wear monthly.',
  },
  {
    id: 'slip_spill',
    category: 'Slips, Trips & Falls',
    hazard: 'Liquid spills in kitchen, café or refreshment areas',
    who: 'Volunteers, congregation, children',
    existingControls: 'Wet floor signs available in kitchen; mop and bucket accessible; staff briefed to report spills immediately.',
    likelihood: 2, severity: 2,
    additionalControls: 'Ensure spills are reported and cleaned within 5 minutes. Non-slip footwear recommended for kitchen volunteers.',
  },
  {
    id: 'trip_cables',
    category: 'Slips, Trips & Falls',
    hazard: 'Trailing cables and leads (AV, PA systems, lighting)',
    who: 'Congregation, volunteers, contractors',
    existingControls: 'Cables taped down or covered with cable protectors during events; AV team briefed on cable management.',
    likelihood: 2, severity: 2,
    additionalControls: 'Inspect cable runs before doors open. Use cable ramps at high-traffic crossing points.',
  },
  {
    id: 'trip_carpet',
    category: 'Slips, Trips & Falls',
    hazard: 'Worn, lifted, or poorly fitted carpet edges and rugs',
    who: 'Congregation, elderly attendees, children',
    existingControls: 'Carpets inspected as part of routine premises check; defects reported to Operations Manager.',
    likelihood: 2, severity: 3,
    additionalControls: 'Replace or repair any lifted carpet edges within 48 hours of identification. Remove loose rugs from high-traffic areas.',
  },
  {
    id: 'trip_uneven_path',
    category: 'Slips, Trips & Falls',
    hazard: 'Uneven or cracked external paths, steps, and car park surfaces',
    who: 'Congregation, elderly attendees, wheelchair users, visitors',
    existingControls: 'External areas inspected quarterly; defects logged and reported to diocese/landlord as appropriate.',
    likelihood: 2, severity: 3,
    additionalControls: 'Temporary cones or barriers around hazardous areas until repaired. Consider lighting improvements at uneven points.',
  },
  {
    id: 'slip_ice',
    category: 'Slips, Trips & Falls',
    hazard: 'Ice and snow on external paths, steps, and car park',
    who: 'Congregation, elderly attendees, staff, volunteers',
    existingControls: 'Grit and salt available on site; responsible person designated for gritting before events in icy conditions.',
    likelihood: 1, severity: 3,
    additionalControls: 'Check weather forecast before early morning services/events. Communicate cancellations early if unsafe.',
  },
  {
    id: 'trip_poor_lighting',
    category: 'Slips, Trips & Falls',
    hazard: 'Poor lighting in corridors, stairwells, car park, or external paths',
    who: 'All attendees, particularly elderly and visually impaired',
    existingControls: 'External lighting checked and working; bulbs replaced promptly; emergency lighting tested every 6 months.',
    likelihood: 1, severity: 2,
    additionalControls: 'Check external lighting before evening events. Consider additional temporary lighting for large events.',
  },

  // ── Fire Safety ──────────────────────────────────────────────────────────
  {
    id: 'fire_candles',
    category: 'Fire Safety',
    hazard: 'Candles left unattended or positioned near combustible materials',
    who: 'Congregation, volunteers, children',
    existingControls: 'Candles only used with specific approval; candle holders appropriate and stable; never left unattended.',
    likelihood: 1, severity: 3,
    additionalControls: 'Designate a responsible person to monitor candles throughout service. Use battery-operated candles where possible.',
  },
  {
    id: 'fire_exit_blocked',
    category: 'Fire Safety',
    hazard: 'Blocked or obstructed fire exit routes or emergency doors',
    who: 'All building occupants',
    existingControls: 'Fire exits checked before every event; signage in place; fire marshal role assigned for all gatherings.',
    likelihood: 1, severity: 3,
    additionalControls: 'Brief fire marshals before every event. Conduct annual evacuation drill. Review exit routes when room layout changes.',
  },
  {
    id: 'fire_combustibles',
    category: 'Fire Safety',
    hazard: 'Accumulation of combustible materials in storage areas or corridors',
    who: 'All building occupants',
    existingControls: 'Storage areas kept tidy; no combustible materials stored in corridors or against boiler room walls.',
    likelihood: 1, severity: 3,
    additionalControls: 'Inspect storage areas monthly. Dispose of excess paper, packaging, and fabric materials promptly.',
  },
  {
    id: 'fire_heaters',
    category: 'Fire Safety',
    hazard: 'Use of portable heaters near combustible materials',
    who: 'All building occupants',
    existingControls: 'Portable heaters must be positioned at least 1m from any combustible material; turned off when room unoccupied.',
    likelihood: 1, severity: 3,
    additionalControls: 'Ban overnight use of portable heaters. Prefer fixed heating systems where possible.',
  },

  // ── Electrical Safety ────────────────────────────────────────────────────
  {
    id: 'elec_pat',
    category: 'Electrical Safety',
    hazard: 'Unplanned electrical faults in portable equipment (not PAT tested)',
    who: 'Volunteers, congregation, staff',
    existingControls: 'PAT testing programme in place; tested equipment labelled; untested equipment not permitted for church use.',
    likelihood: 1, severity: 3,
    additionalControls: 'Maintain PAT register. Remove any equipment with expired PAT label immediately. Annual PAT testing minimum.',
  },
  {
    id: 'elec_damaged',
    category: 'Electrical Safety',
    hazard: 'Damaged or frayed extension cables, multi-way adaptors, or leads',
    who: 'Volunteers, congregation, contractors',
    existingControls: 'Electrical equipment visually inspected before use; damaged items removed from service immediately.',
    likelihood: 1, severity: 3,
    additionalControls: 'Brief all volunteers to report damaged cables. Remove and dispose of any damaged equipment immediately.',
  },
  {
    id: 'elec_overload',
    category: 'Electrical Safety',
    hazard: 'Overloaded electrical circuits or multi-way adaptors',
    who: 'Volunteers, congregation',
    existingControls: 'No daisy-chaining of extension leads; electrical load assessed before large events with additional equipment.',
    likelihood: 1, severity: 3,
    additionalControls: 'Consult electrician if total electrical load for events exceeds normal usage. Never use adaptor on adaptor.',
  },

  // ── Manual Handling ──────────────────────────────────────────────────────
  {
    id: 'mh_chairs',
    category: 'Manual Handling',
    hazard: 'Lifting and moving chairs, tables, and furniture when setting up or clearing rooms',
    who: 'Volunteers, staff',
    existingControls: 'Volunteers briefed on safe lifting technique; trolleys available for moving chairs and tables in bulk.',
    likelihood: 2, severity: 2,
    additionalControls: 'No volunteer to lift heavy items alone. Provide manual handling awareness guidance at volunteer inductions.',
  },
  {
    id: 'mh_av',
    category: 'Manual Handling',
    hazard: 'Moving heavy AV, PA, or production equipment',
    who: 'Volunteers, AV team',
    existingControls: 'Heavy AV equipment moved by two or more people; wheeled flight cases and trolleys used where available.',
    likelihood: 2, severity: 2,
    additionalControls: 'Mark equipment cases with weight. Consider specialist lifting equipment for items over 25kg.',
  },
  {
    id: 'mh_deliveries',
    category: 'Manual Handling',
    hazard: 'Handling large or heavy deliveries (furniture, food supplies, equipment)',
    who: 'Staff, volunteers',
    existingControls: 'Sack trucks and trolleys available; deliveries coordinated to ensure adequate personnel available.',
    likelihood: 2, severity: 2,
    additionalControls: 'Arrange deliveries when multiple volunteers available. Do not accept oversized deliveries that cannot be handled safely.',
  },

  // ── Work at Height ───────────────────────────────────────────────────────
  {
    id: 'wah_lightbulbs',
    category: 'Work at Height',
    hazard: 'Changing lightbulbs or electrical fittings at height',
    who: 'Volunteers, maintenance staff',
    existingControls: 'Appropriate stepladder or platform ladder used; second person present to foot the ladder; work planned.',
    likelihood: 1, severity: 3,
    additionalControls: 'Never use chairs or makeshift platforms. Consider appointing approved electrical contractor for high fittings.',
  },
  {
    id: 'wah_decorating',
    category: 'Work at Height',
    hazard: 'Putting up decorations, banners, or displays at height',
    who: 'Volunteers',
    existingControls: 'Only trained volunteers carry out work at height; appropriate ladder used; second person always present.',
    likelihood: 1, severity: 3,
    additionalControls: 'Pre-plan decoration placement to minimise height access. Use telescopic tools where possible to avoid climbing.',
  },
  {
    id: 'wah_roof',
    category: 'Work at Height',
    hazard: 'Roof access or gutter clearance by maintenance personnel',
    who: 'Contractors, maintenance staff',
    existingControls: 'Roof access restricted to qualified contractors only; work not carried out in adverse weather; scaffold or MEWP used.',
    likelihood: 1, severity: 3,
    additionalControls: 'All roof work carried out by insured contractors. Ensure method statement and risk assessment provided before work begins.',
  },

  // ── Safeguarding ─────────────────────────────────────────────────────────
  {
    id: 'sg_two_adult',
    category: 'Safeguarding',
    hazard: 'Breach of two-adult rule — child left alone with one adult',
    who: 'Children, vulnerable adults',
    existingControls: 'Two-adult rule enforced at all children\'s and youth activities; volunteers briefed at induction and annually.',
    likelihood: 1, severity: 3,
    additionalControls: 'Brief all leaders before each session. Cancel or combine groups if insufficient leaders available.',
  },
  {
    id: 'sg_dbs',
    category: 'Safeguarding',
    hazard: 'Volunteer in regulated activity without a valid DBS check',
    who: 'Children, vulnerable adults',
    existingControls: 'DBS register maintained by PSO; no volunteer commences regulated activity before enhanced DBS is returned.',
    likelihood: 1, severity: 3,
    additionalControls: 'PSO to review DBS register quarterly. Renewal reminders issued 3 months before expiry.',
  },
  {
    id: 'sg_disclosure',
    category: 'Safeguarding',
    hazard: 'Safeguarding disclosure not recognised or escalated promptly',
    who: 'Children, vulnerable adults',
    existingControls: 'All volunteers complete Foundation Safeguarding Training; PSO contact details displayed; clear escalation procedure.',
    likelihood: 1, severity: 3,
    additionalControls: 'Annual safeguarding briefing for all staff and volunteers. PSO to be contactable at all times during activities.',
  },
  {
    id: 'sg_lone_working',
    category: 'Safeguarding',
    hazard: 'Staff or volunteer lone working in building with children or vulnerable adults',
    who: 'Children, vulnerable adults, lone worker',
    existingControls: 'Lone working policy in place; lone working avoided where possible; sign-in/out system maintained.',
    likelihood: 1, severity: 3,
    additionalControls: 'Ensure buddy system for lone working. Regular welfare check calls for lone workers.',
  },

  // ── Food & Allergens ─────────────────────────────────────────────────────
  {
    id: 'food_allergen',
    category: 'Food & Allergens',
    hazard: 'Allergen cross-contamination or undeclared allergens in food served at events',
    who: 'Congregation, visitors, children — particularly those with allergies',
    existingControls: 'Allergen information displayed for all food served; volunteers briefed on 14 major allergens; Natasha\'s Law compliance for PPDS food.',
    likelihood: 2, severity: 3,
    additionalControls: 'Designate an allergen lead for events with catering. Encourage attendees with severe allergies to contact organisers in advance.',
  },
  {
    id: 'food_temperature',
    category: 'Food & Allergens',
    hazard: 'Incorrect storage or serving temperatures for hot or cold food',
    who: 'Congregation, volunteers, visitors',
    existingControls: 'Hot food served above 63°C; cold food kept below 8°C; food not left out for more than 2 hours.',
    likelihood: 1, severity: 3,
    additionalControls: 'Use food thermometers for large-scale catering. Brief food volunteers on temperature control before every event.',
  },
  {
    id: 'food_hygiene',
    category: 'Food & Allergens',
    hazard: 'Poor food handler hygiene (hand washing, illness)',
    who: 'Congregation, visitors',
    existingControls: 'Handwashing facilities available in kitchen; food handlers briefed not to work when ill; Level 2 Food Hygiene holders preferred.',
    likelihood: 1, severity: 3,
    additionalControls: 'Post handwashing reminder signs in kitchen. Exclude any volunteer with vomiting or diarrhoea for 48 hours after symptoms resolve.',
  },
  {
    id: 'food_urn',
    category: 'Food & Allergens',
    hazard: 'Burns and scalds from hot water urns or kettles',
    who: 'Volunteers, congregation, children',
    existingControls: 'Urns positioned away from pedestrian traffic; children not permitted in kitchen area; volunteers briefed on safe use.',
    likelihood: 2, severity: 2,
    additionalControls: 'Position urns against walls. Barrier or table arrangement to prevent public access to hot drinks area.',
  },

  // ── Crowd & Events ───────────────────────────────────────────────────────
  {
    id: 'crowd_overcrowding',
    category: 'Crowd & Events',
    hazard: 'Overcrowding or inadequate egress at large events',
    who: 'All attendees',
    existingControls: 'Maximum occupancy limit established and monitored; fire marshals positioned at exits; ticket/registration system in use.',
    likelihood: 1, severity: 3,
    additionalControls: 'Brief all stewards on occupancy limits. Appoint a dedicated crowd safety lead for events over 200 attendees.',
  },
  {
    id: 'crowd_first_aid',
    category: 'Crowd & Events',
    hazard: 'Medical emergency at an event with no first aider on site',
    who: 'All attendees, particularly elderly and those with health conditions',
    existingControls: 'First aider confirmed present before any gathering; first aid kit location known to all welcome team leads; nearest AED location displayed.',
    likelihood: 1, severity: 3,
    additionalControls: 'Consider additional qualified first aiders for events over 100 attendees. Confirm AED battery and pads are in date before large events.',
  },
  {
    id: 'crowd_child_separation',
    category: 'Crowd & Events',
    hazard: 'Child becoming separated from parent or guardian at a large event',
    who: 'Children',
    existingControls: 'Reunion point established and communicated at large events; wristbands or contact card scheme available for young children.',
    likelihood: 1, severity: 2,
    additionalControls: 'Announce reunion point at start of all family events. Stewards briefed on lost child procedure.',
  },
  {
    id: 'crowd_temp_structures',
    category: 'Crowd & Events',
    hazard: 'Temporary structures (staging, marquees, display boards) collapsing or failing',
    who: 'All attendees, volunteers',
    existingControls: 'Temporary structures erected by competent persons; manufacturer guidance followed; structures inspected before use and during event.',
    likelihood: 1, severity: 3,
    additionalControls: 'For large structures, obtain structural assessment from supplier. Remove or secure all temporary structures if high winds forecast.',
  },

  // ── Outdoor & Environment ────────────────────────────────────────────────
  {
    id: 'outdoor_weather',
    category: 'Outdoor & Environment',
    hazard: 'Adverse weather conditions at outdoor activities or events',
    who: 'All attendees, volunteers, children',
    existingControls: 'Weather forecast checked 48 hours before outdoor events; contingency plan (shelter or cancellation) in place.',
    likelihood: 2, severity: 2,
    additionalControls: 'Communicate contingency plans to attendees in advance. Designate a weather monitor for multi-day outdoor activities.',
  },
  {
    id: 'outdoor_sun',
    category: 'Outdoor & Environment',
    hazard: 'Heat-related illness or sunburn at outdoor summer events',
    who: 'Children, elderly attendees, all participants',
    existingControls: 'Shade available or created; water provided; sun protection advised in event communications.',
    likelihood: 1, severity: 2,
    additionalControls: 'First aider briefed on heat exhaustion treatment. Encourage sun cream use, particularly for children.',
  },
  {
    id: 'outdoor_water',
    category: 'Outdoor & Environment',
    hazard: 'Drowning or water-related injury at events near open water',
    who: 'Children, young people, all attendees',
    existingControls: 'Water safety assessment completed; exclusion zones established around water; qualified lifesaver/first responder on site.',
    likelihood: 1, severity: 3,
    additionalControls: 'Mandatory briefing to all attendees on water exclusion zones. Life ring and throw-line available at waterside.',
  },

  // ── Health & Wellbeing ───────────────────────────────────────────────────
  {
    id: 'health_lone_worker',
    category: 'Health & Wellbeing',
    hazard: 'Staff member or volunteer working alone in the building without check-in procedure',
    who: 'Lone workers',
    existingControls: 'Lone working policy in place; staff sign in and out; manager has out-of-hours emergency contact for lone workers.',
    likelihood: 1, severity: 2,
    additionalControls: 'Regular welfare call-in for lone workers (at least every 2 hours). Buddy contacts must know the lone worker schedule.',
  },
  {
    id: 'health_stress',
    category: 'Health & Wellbeing',
    hazard: 'Volunteer burnout and mental health impact from excessive workload or responsibility',
    who: 'Volunteers, staff',
    existingControls: 'Regular volunteer wellbeing check-ins; clear role boundaries; open-door policy for raising concerns with Operations Manager.',
    likelihood: 2, severity: 2,
    additionalControls: 'Monitor volunteer hours and workload. Ensure adequate rest periods between demanding activities.',
  },

  // ── Security ─────────────────────────────────────────────────────────────
  {
    id: 'security_unauthorised',
    category: 'Security',
    hazard: 'Unauthorised person gaining access to children\'s areas or private spaces',
    who: 'Children, vulnerable adults, staff',
    existingControls: 'Children\'s areas have controlled access; visitor sign-in procedure in place; volunteers briefed to challenge unknown adults.',
    likelihood: 1, severity: 3,
    additionalControls: 'Ensure children\'s room doors are visible or have window. Brief all volunteers on challenging unknown adults respectfully.',
  },
  {
    id: 'security_theft',
    category: 'Security',
    hazard: 'Theft of personal belongings or church property during events',
    who: 'Congregation, volunteers, church',
    existingControls: 'Valuables not left unattended; collection money secured promptly; CCTV in place at entrances.',
    likelihood: 1, severity: 2,
    additionalControls: 'Communicate to attendees not to leave valuables unattended. Ensure two people present when counting and transporting collections.',
  },
];

// ── Load/save custom entries ──────────────────────────────────────────────────

export function loadCustomLibrary() {
  try { return JSON.parse(localStorage.getItem(HL_LS_KEY)) || []; } catch { return []; }
}

export function saveCustomLibrary(entries) {
  try { localStorage.setItem(HL_LS_KEY, JSON.stringify(entries)); } catch (_) {}
}

export function getAllLibraryEntries() {
  return [...BUILT_IN_LIBRARY, ...loadCustomLibrary()];
}
