# Development Plans — STF Risk Assessment Manager

> Written by Claude (Fable 5) after a full code review on 10 June 2026.
> Intended executor: Claude Opus. Work the phases in order — Phase 0 contains
> real bugs that affect data integrity and should land before any new features.
>
> **Working rules (from James):** plan before code, surgical patches over rewrites,
> give full file contents when supplying Worker code, never hardcode the admin
> password (comes only from the `VITE_ADMIN_PASSWORD` GitHub Secret), service
> account credentials live only in Cloudflare Worker env vars.
>
> **Deploy model:** push to `main` → GitHub Actions builds with `VITE_*` secrets →
> GitHub Pages. PWA service worker caches aggressively — verify with a hard
> refresh or `?nocache=1` and check the hashed bundle filename changed.

---

## Architecture snapshot (verified against code)

- React 18 + Vite SPA, all styling inline + `src/styles.css` for breakpoints/tokens.
- Editorial design system (Playfair Display / DM Sans, parchment palette) applied
  to: `App.jsx`, `Dashboard.jsx`, `RAList.jsx`, `StaffSettings.jsx`,
  `LegislationHub.jsx`, `index.html`, `riskData.js` (commit `f15d42e`).
  **NOT yet applied to:** `RAEditor.jsx`, `RAWizard.jsx`, `RAPreview.jsx`.
- Storage: `src/utils/storage.js`. Reads Sheets via API key; writes via Cloudflare
  Worker (`stf-sheets-writer`, JWT service-account auth, `text/plain` body to
  dodge CORS preflight). localStorage (`sfm_ra_v2`) is always written as cache.
- Sheet tabs: `assessments` (A–V, 22 cols), `hazards` (A–K), `staff` (A–E),
  `settings` (A–B), `audit_log` (A–C append-only).
- Hazard library: `src/data/hazardLibrary.js` — 123 built-in entries, 15 categories
  + 'All'. Custom entries scaffolded in localStorage (`sfm_hazard_library_custom`)
  via `loadCustomLibrary()`/`saveCustomLibrary()` but **no UI to create them yet**.
- Auth: `useAuth.jsx`, sessionStorage flag, password baked at build time.

---

## Phase 0 — Bug fixes (do these first)

### 0.1 Status value mismatch: `'review'` vs `'needs_review'` (data-corrupting)

`RAEditor.jsx` line ~144: the Status dropdown writes `value="review"`:

```jsx
<option value="review">Needs Review</option>
```

Everywhere else (`useRiskAssessments.js` auto-status, `RAList.jsx` filters/badges,
`Dashboard.jsx` stats) uses `'needs_review'`. Consequences:

- Manually setting "Needs Review" in the editor produces a status no filter or
  stat counts; the RA disappears from the Needs Review workflow.
- Opening an RA that is already `needs_review` shows a blank/wrong dropdown
  selection (no matching option).

**Fix:** change the option to `value="needs_review"`. Also add a one-time
migration in `useRiskAssessments.js` load path: map any `a.status === 'review'`
to `'needs_review'` (same pattern as the existing auto-status block, persist via
`patchLocalAssessments`).

### 0.2 Deletions never propagate to Google Sheets (data resurrection)

`useRiskAssessments.js` `deleteRA` calls `saveAssessment(null, next)`. In
`storage.js`, with `ra = null`:

- the assessments upsert is skipped (`rowIdx` is `-1`, `else if (ra)` false) —
  the deleted RA's row **stays in the sheet**;
- the hazards rewrite filters `r[1] !== ra?.id` → `r[1] !== undefined` → keeps
  everything, so orphaned hazards also stay.

Net effect: delete an RA, reload the app (Sheets is the source of truth on
load), and **the deleted assessment comes back**.

**Fix:** add a dedicated `deleteAssessment(id, remainingAssessments)` export in
`storage.js`:

1. `saveToLocal({ assessments: remainingAssessments })`.
2. If Sheets enabled: read `assessments!A2:V`, filter out the row whose col A
   matches `id`, then `clear` + `update` the full tab (same pattern
   `syncToSheets` already uses). Same for `hazards!A2:K` filtering col B.
3. `appendAuditLog(\`Deleted assessment: ${id}\`)`.

Call it from `deleteRA` instead of `saveAssessment(null, …)`.

### 0.3 Staff/settings updates leave stale rows in Sheets

`saveStaff` and `saveSettings` write with `'update'` starting at row 2 but never
clear. If the new list is shorter than the old (staff member removed, setting
key removed), the trailing old rows survive and **deleted entries resurrect on
next load**.

**Fix:** in both functions, `await sheetsWrite(range, [], 'clear')` before the
`update`, mirroring `syncToSheets`.

### 0.4 RAEditor risk summary uses hardcoded old palette

`RAEditor.jsx` sidebar (~line 290) hardcodes the pre-redesign colours:

```jsx
[['Low','#16a34a','#dcfce7','#86efac'], ...]
```

`RISK_LEVELS` in `riskData.js` was updated to the desaturated palette, so the
editor sidebar now disagrees with every other risk badge in the app.

**Fix:** import `RISK_LEVELS` and iterate
`Object.entries(RISK_LEVELS).map(([level, { color, bg, border }]) => …)`.
(This partially overlaps with Phase 1 — fine to fold it in there.)

**Acceptance for Phase 0:** set an RA to Needs Review in the editor → it appears
under the Needs Review filter and dashboard stat; delete an RA → reload with
Sheets enabled → it stays deleted (check the sheet rows too); remove a staff
member → reload → still gone; editor risk summary colours match RAList badges.

---

## Phase 1 — Finish the design system (RAEditor, RAWizard, RAPreview)

Commit `f15d42e` restyled 5 of 8 UI surfaces. Apply the same system to the rest.
Reference any already-converted file (e.g. `RAList.jsx`) for the exact values.

**Token mapping used everywhere (old → new):**

| Old | New |
|---|---|
| `#0f172a` (ink/primary btn) | `#1C1C1A` text / `#1A3D2B` buttons & active states |
| `#64748b` | `#8C887E` |
| `#475569` | `#5C5852` |
| `#374151` | `#2A2A28` |
| `#94a3b8` / `#cbd5e1` | `#C8C2B8` |
| `#e2e8f0` (borders) | `#E4DDD2` |
| `#f8fafc` / `#f1f5f9` | `#F5F2EB` |
| `#fff` (cards) | `#FEFEFC` |
| `#16a34a` green | `#1A5C38` (light `#EAF4EE`, border `#9BCAAC`) |
| `#dc2626` red | `#8B2430` (light `#FAF0F1`, border `#D4A0A6`) |
| `#d97706` amber | `#8B5B18` (light `#FDF3E4`, border `#D4AA6A`) |
| `#7c3aed` purple | `#452870` (light `#F2EDF8`, border `#BDB0D8`) |
| `#1e40af` blue (library btn) | `#1A3D2B` green or `#9A6B1E` gold — pick gold to distinguish from primary |

**Per file:**

- **`RAEditor.jsx`** — update the `css` object at top (input/textarea/select/btn/label);
  sticky toolbar: `background: '#F5F2EB'`, note nav height is now **60px** so
  `top: 58` → `top: 60`; section `h3` headings stay sans (they're small caps);
  the page title in the toolbar gets `fontFamily: "'Playfair Display', Georgia, serif"`;
  hazard-row left border colours come from `RISK_LEVELS` (already correct via
  `getRiskLevel`); library modal: active category tab `#1A3D2B`, CUSTOM chip
  `#FDF5E4`/`#9A6B1E`; toggles `#1A3D2B` when on; fix 0.4 here too.
- **`RAWizard.jsx`** — modal header `background: '#1A3D2B'` with the step title in
  Playfair Display; progress pips active `#C8952E`, inactive `rgba(255,255,255,.25)`;
  selected category/flag cards use `#1A3D2B` borders and `#E8F2EC` fills instead
  of dark-fill (`background: on ? '#0f172a'` → keep selected state readable:
  border `#1A3D2B`, bg `#E8F2EC`, text `#1A3D2B`); confirm button `#1A3D2B`
  (not `#16a34a`); checkboxes `#1A3D2B`.
- **`RAPreview.jsx`** — **screen chrome only** (toolbar, page background). The
  printed document itself is a formal A3 landscape register — keep its print
  styles black-on-white and ink-light; do not put parchment backgrounds or web
  fonts in `@media print` (Playfair via Google Fonts may not load in print
  contexts reliably; Georgia fallback is fine there).

**Acceptance:** click through Dashboard → New assessment (wizard, all 4 steps) →
editor (open library modal) → Preview. No cold-slate colours anywhere on screen;
print preview still clean monochrome; sticky toolbar doesn't gap under the nav.

---

## Phase 2 — Standalone Hazard Library browser page

James's most-wanted next feature. The 123 entries are only reachable mid-edit.

**New file `src/pages/HazardLibrary.jsx`:**

- Read-only browse/search UI, visible to everyone (not admin-gated).
- Reuse the modal's internals from `RAEditor.jsx`: search input, category tabs
  from `LIBRARY_CATEGORIES`, entry cards with risk badge, who, controls.
  Extract the entry-card into a small shared component if it keeps the diff
  surgical; otherwise duplicate — it's ~30 lines.
- Header: Playfair title "Hazard Library", subtitle "123 pre-built hazards ·
  N custom" (compute counts, don't hardcode 123).
- Include custom entries via `loadCustomLibrary()` merged like the editor does.
- Stagger cards with the `fadeUp` animation like RAList rows.

**Wiring in `App.jsx`:**

- Nav array: add `{ key: 'library', label: 'Hazard Library' }` after
  Legislation (visible to all users).
- Route: `{page === 'library' && <HazardLibrary isAdmin={isAdmin} />}`.

**Acceptance:** logged-out user can browse/search/filter all entries from the
nav; categories tabs work; no add-to-assessment button appears (that flow stays
in the editor).

---

## Phase 3 — Custom hazard library entries (complete the scaffold)

`hazardLibrary.js` already exports `loadCustomLibrary`/`saveCustomLibrary`
(localStorage `sfm_hazard_library_custom`). The editor modal currently shows a
placeholder `<details>` saying the feature is coming. Build it:

1. **"Save to library" on hazard rows (RAEditor):** small button on each hazard
   row (admin only): takes the row's hazard/who/existingControls/likelihood/
   severity/additionalControls, prompts for a category (select from the 15),
   creates `{ id: 'custom_' + Date.now(), … }`, appends via `saveCustomLibrary`,
   updates `customEntries` state. Replace the placeholder `<details>` block with
   a short hint pointing at the per-row button.
2. **Manage custom entries (library page from Phase 2):** admin-only section
   listing custom entries with edit (inline form) and delete. Keep it simple —
   a card with the same fields as the built-ins.
3. **Custom badge:** the editor modal flags custom entries with
   `!entry.id.match(/^[a-z_]+$/)` — fragile. Replace with an explicit check:
   `entry.id.startsWith('custom_')` in both editor modal and library page.

**Known limitation to note in the UI:** custom entries are per-browser
(localStorage only). Syncing them to a `hazard_library` Sheets tab is a
follow-up — design the save shape so adding a sync layer later doesn't break
stored entries.

**Acceptance:** create a custom entry from a hazard row → it appears in the
library page and editor modal with a CUSTOM chip → survives reload → can be
edited and deleted from the library page.

---

## Phase 4 — Audit log viewer

The Worker already appends to `audit_log` (timestamp, message, UA). Surface it:

- New tab in `StaffSettings.jsx`: "Audit Log" (admin-only page already).
- Read via existing `sheetsRead('audit_log!A2:C')` — add an exported
  `loadAuditLog()` in `storage.js` that returns `[{ ts, message, agent }]`
  reversed (newest first), capped to the last 200 rows.
- Render as a simple timeline list: date (en-GB), message, muted UA string.
  Show a friendly empty/error state when Sheets isn't configured.
- No new write paths needed.

**Acceptance:** Settings → Audit Log shows recent entries newest-first; making a
save then refreshing the tab shows the new entry.

---

## Phase 5 — Backlog (in rough priority order, not yet planned in detail)

1. **Read-only share links** — e.g. `?view=<ra-id>` opens RAPreview directly
   without admin. Needs hash-param routing in `App.jsx`; everything else exists.
2. **Audit log identity** — append `'admin'`/`'viewer'` to audit rows; trivial
   once 4 lands.
3. **Archived filter** — editor can set `archived` but RAList has no filter chip
   for it; archived RAs are visible under All only. Add a chip.
4. **Hazard library → Sheets sync** — `hazard_library` tab, merge on load.
5. **Email reminders for overdue reviews** — scheduled Cloudflare Worker reading
   the sheet; out of app scope, needs its own design.
6. **Concurrency hardening** — `saveAssessment` does clear-then-rewrite of the
   whole hazards tab; two admins saving simultaneously can clobber each other.
   Low likelihood (one admin: James), revisit only if more admins are added.

---

## Verification checklist for every phase

1. `npm run build` locally — must pass before pushing.
2. Push to `main`, wait for Actions, then load the site and confirm the hashed
   `assets/index-*.js` filename changed (service worker may need `?nocache=1`).
3. Smoke-test logged-out first, then admin login, then the changed surface.
4. After any storage.js change: save an RA, reload, confirm it round-trips from
   Sheets; check the sheet rows directly if in doubt.
