# STF Risk Assessment Manager — Setup Guide

## Overview
This app runs on **GitHub Pages** (free static hosting) with **Google Sheets** as the optional data backend.
Without Google Sheets configured, all data is stored in the browser's localStorage — fully functional
for a single-device admin. Set up Sheets when you want data shared across devices or staff.

---

## Part 1 — Repository Setup

### 1.1 Create the GitHub repository

1. Go to https://github.com/new
2. Name it exactly: `sfm-risk-assessments`
3. Set it to **Private** (recommended for church data)
4. Click **Create repository**

### 1.2 Upload the app files

Option A — GitHub web interface (easiest):
1. In your new repo, click **Add file → Upload files**
2. Drag in all the files from the `sfm-risk-app` folder
3. Commit with message: `Initial commit`

Option B — Git command line:
```bash
cd sfm-risk-app
git init
git remote add origin https://github.com/jamesduffield1-creator/sfm-risk-assessments.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 1.3 Verify vite.config.js

Open `vite.config.js` and confirm:
```js
base: '/sfm-risk-assessments/',
```
The repo name in `base` must match your GitHub repository name exactly.

---

## Part 2 — GitHub Secrets (passwords & credentials)

All sensitive credentials are stored as **GitHub Secrets** — they are never in the code.

1. Go to your repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret** for each of the following:

| Secret Name | Required? | Description |
|---|---|---|
| `VITE_ADMIN_PASSWORD` | ✅ Always | Admin login password for the app |
| `VITE_SHEET_ID` | ⬜ For Sheets | Google Sheet ID (see Part 3) |
| `VITE_SHEETS_API_KEY` | ⬜ For Sheets | Google API key for reading Sheets |
| `VITE_WORKER_URL` | ⬜ For Sheets | Cloudflare Worker URL for writing Sheets (see Part 4) |

**Recommended admin password format:** `STF-[word]-[year]` e.g. `STF-Mackworth-2025`  
Change it by updating the secret — redeploy happens automatically.

Without `VITE_SHEET_ID` and `VITE_SHEETS_API_KEY` the app works entirely from localStorage.
Use Admin → Staff & Settings → Data & Backup to export regular JSON backups.

---

## Part 3 — Google Sheets Setup (optional but recommended)

### 3.1 Create the spreadsheet

1. Go to https://sheets.google.com
2. Create a new blank spreadsheet
3. Name it: `STF Risk Assessments`
4. Create the following tabs (click + at the bottom for each):
   - `assessments`
   - `hazards`
   - `staff`
   - `settings`
   - `audit_log`

### 3.2 Add column headers

**assessments tab — Row 1 (22 columns, A–V):**
```
id | ref | name | category | location | legislation | reviewMonths | whoAtRisk | involvesChildren | involvesVulnerableAdults | involvesFood | isOutdoor | status | version | assessedBy | assessedDate | reviewDate | approvedBy | pccNoted | vicarSignoff | createdAt | updatedAt
```

**hazards tab — Row 1:**
```
id | assessmentId | hazard | who | existingControls | likelihood | severity | additionalControls | owner | deadline | sortOrder
```

**staff tab — Row 1:**
```
key | label | name | email | phone
```

**settings tab — Row 1:**
```
key | value
```

**audit_log tab — Row 1:**
```
timestamp | message | userAgent
```

### 3.3 Get the Sheet ID

Your Sheet ID is in the URL when you have the spreadsheet open:
```
https://docs.google.com/spreadsheets/d/THIS-IS-YOUR-SHEET-ID/edit
```
Copy it and add it as the `VITE_SHEET_ID` secret.

### 3.4 Create a Google Cloud API key (for reading)

1. Go to https://console.cloud.google.com
2. Create a new project — name it `STF Risk App`
3. Go to **APIs & Services → Library**
4. Search for **Google Sheets API** → Enable it
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. Copy the key
8. Click **Edit API Key** → Restrict it:
   - Application restriction: **HTTP referrers**
   - Add: `https://jamesduffield1-creator.github.io/*`
   - API restriction: **Google Sheets API** only
9. Add the key as `VITE_SHEETS_API_KEY` secret

**Important:** This key only allows *reading* the sheet. Writes require the Worker (Part 4).

---

## Part 4 — Cloudflare Worker (for writing data to Sheets)

Google Sheets requires OAuth for writes. A small Cloudflare Worker signs requests with a service account.  
Cloudflare Workers are **free** for up to 100,000 requests/day.

### 4.1 Create a Google Service Account

1. In Google Cloud Console → **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Name: `stf-sheets-writer`
4. Click **Create and Continue** → skip optional steps → **Done**
5. Click on the service account → **Keys tab**
6. **Add Key → Create new key → JSON** → Download the file
7. Open the JSON file — you'll need `client_email` and `private_key`

### 4.2 Share the spreadsheet with the service account

1. Open your Google Sheet
2. Click **Share**
3. Paste in the service account email (looks like `stf-sheets-writer@your-project.iam.gserviceaccount.com`)
4. Give it **Editor** access
5. Click **Send**

### 4.3 Create the Cloudflare Worker

1. Go to https://workers.cloudflare.com → **Sign up free**
2. Go to **Workers → Create a Worker**
3. Name it: `stf-sheets-writer`
4. Replace the default code with:

```javascript
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { range, values, operation = 'append' } = await request.json();
    const token   = await getToken(env.CLIENT_EMAIL, env.PRIVATE_KEY);
    const sheetId = env.SHEET_ID;

    let url, fetchMethod, fetchBody;

    if (operation === 'update') {
      // Overwrite specific rows at the given range (PUT)
      url         = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
      fetchMethod = 'PUT';
      fetchBody   = JSON.stringify({ range, values });
    } else if (operation === 'clear') {
      // Wipe a range (keeps header row intact if you start from row 2)
      url         = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:clear`;
      fetchMethod = 'POST';
      fetchBody   = '{}';
    } else {
      // Default: append new rows at the end of data
      url         = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
      fetchMethod = 'POST';
      fetchBody   = JSON.stringify({ values });
    }

    const res = await fetch(url, {
      method:  fetchMethod,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    fetchBody,
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status:  res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
    });
  }
};

function corsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || 'https://jamesduffield1-creator.github.io';
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function getToken(clientEmail, privateKeyPem) {
  const now     = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  };
  const encode = obj =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pemBody = privateKeyPem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const key     = await crypto.subtle.importKey(
    'pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig    = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signingInput}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const { access_token } = await tokenRes.json();
  return access_token;
}
```

5. Click **Save and Deploy**

### 4.4 Add Worker environment variables

In Cloudflare Worker → **Settings → Variables → Add variable** (mark each as **Secret**):

| Variable | Value |
|---|---|
| `CLIENT_EMAIL` | The `client_email` from your service account JSON |
| `PRIVATE_KEY` | The `private_key` from your service account JSON |
| `SHEET_ID` | Your Google Sheet ID |
| `ALLOWED_ORIGIN` | `https://jamesduffield1-creator.github.io` |

6. Copy your Worker URL (looks like: `https://stf-sheets-writer.YOUR-SUBDOMAIN.workers.dev`)
7. Add it as `VITE_WORKER_URL` in GitHub Secrets

---

## Part 5 — Enable GitHub Pages

1. In your repo → **Settings → Pages**
2. Source: **GitHub Actions** (not "Deploy from a branch")
3. Click **Save**

After the first successful deploy, your app will be live at:
```
https://jamesduffield1-creator.github.io/sfm-risk-assessments/
```

---

## Part 6 — First Deploy & Testing

1. Push any change to the `main` branch (or trigger manually: **Actions → Deploy to GitHub Pages → Run workflow**)
2. Wait ~2 minutes for the build to complete
3. Go to the URL above
4. Verify assessments load and the dashboard shows stats
5. Click **Admin login** → enter your password → verify full edit access
6. Admin → **Staff & Settings → Data & Backup** → export a backup to verify data download works

---

## Sharing with Staff

**For all staff (Reader view):**  
Simply share the URL. No login required — they can browse, filter, and print any RA.

**For admin staff:**  
Share the URL + admin password via a private WhatsApp message rather than email.

---

## Ongoing Maintenance

| Task | How often | Who |
|---|---|---|
| Export JSON backup | Monthly | Operations Manager |
| Review overdue RAs | Monthly | Operations Manager |
| Update staff directory | When staff changes | Operations Manager (Admin) |
| Rotate admin password | Annually | Operations Manager |
| Review compliance checklist | Annually (pre-PCC) | Operations Manager |

---

## Troubleshooting

**App shows blank page after deploy:**  
Check `base` in `vite.config.js` matches your repo name exactly, and that Pages source is set to "GitHub Actions".

**"Sheets read failed" error:**  
Check `VITE_SHEET_ID` and `VITE_SHEETS_API_KEY` secrets are set correctly.  
Verify the Sheet is shared with "Anyone with the link" → Viewer, OR that the API key is unrestricted.

**Write operations not saving to Sheets:**  
The app saves to localStorage automatically as a fallback.  
Check the Worker is deployed, `VITE_WORKER_URL` secret is correct, and the `ALLOWED_ORIGIN` Worker variable matches your GitHub Pages domain.  
Check Worker logs in Cloudflare dashboard.

**Admin password not working:**  
Check `VITE_ADMIN_PASSWORD` secret is set and the app has been redeployed since setting it.

**Assessments disappeared:**  
Use Admin → Staff & Settings → Data & Backup → Import to restore from a JSON backup.
