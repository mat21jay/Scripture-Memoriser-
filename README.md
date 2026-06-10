# Scripture Memoriser — by Mat Judah

> "Thy word have I hid in mine heart" — Psalm 119:11 KJV

A Christian scripture memorisation app with AI-powered prayer generation.
Free 7-day trial → $10.99 lifetime access via PayPal.

---

## BEFORE YOU DEPLOY — 3 things to update in src/App.js

Open `src/App.js` and update these 3 lines near the top:

```js
const PAYPAL_LINK = "https://www.paypal.com/paypalme/YOUR_PAYPAL_USERNAME";
const AMAZON_LINK = "https://www.amazon.com/author/YOUR_AUTHOR_PAGE";
// Replace PLACEHOLDER in each BOOKS entry with your real Amazon ASIN
```

Also update each book's `asin` field in the BOOKS array with your real Amazon ASIN numbers.
(Find your ASIN in your KDP dashboard or in the Amazon URL of your book.)

---

## DEPLOY IN 4 STEPS (free, ~10 minutes)

### Step 1 — Create a free GitHub account
Go to https://github.com and sign up (free).

### Step 2 — Upload this folder to GitHub
1. Click "New repository" on GitHub
2. Name it: `scripture-memoriser`
3. Click "Create repository"
4. Click "uploading an existing file"
5. Drag and drop ALL the files from this folder into the upload box
   (make sure to keep the folder structure: src/App.js, src/index.js, public/index.html, package.json)
6. Click "Commit changes"

### Step 3 — Create a free Vercel account
Go to https://vercel.com and sign up with your GitHub account (free).

### Step 4 — Deploy
1. In Vercel, click "Add New Project"
2. Select your `scripture-memoriser` repository
3. Vercel auto-detects it as a React app — just click "Deploy"
4. In 2 minutes your app is live at: `scripture-memoriser.vercel.app`

---

## SET UP PAYMENTS

### PayPal.me (recommended — free)
1. Go to https://paypal.me and create your link: `paypal.me/YourName`
2. Update PAYPAL_LINK in App.js with your link
3. When someone pays, email them their unlock code (currently "MATJUDAH" for testing — 
   change this to your own secret code in the ProModal component)

### Ko-fi (for donations)
Already linked to: https://ko-fi.com/pstrmatjudah ✓

---

## CUSTOM DOMAIN (optional, ~$12/year)
1. Buy a domain from Namecheap (e.g. `scripturememoriser.com`)
2. In Vercel → your project → Settings → Domains → add your domain
3. Follow the DNS instructions (takes ~30 minutes to go live)

---

## HOW THE TRIAL & LIFETIME SYSTEM WORKS

- First visit: 7-day free trial starts automatically (stored in browser)
- Trial gives full Pro access for 7 days
- After trial: NIV/KJV + Memorise/Quiz only (free forever)
- $10.99 PayPal payment → user emails you → you send unlock code → they enter it
- Unlock code activates lifetime access (stored in browser)

NOTE: This is a simple honour-based system for launch. When you have 100+ users,
add a real backend (Supabase free tier) to verify PayPal payments automatically.

---

## FILE STRUCTURE
```
scripture-memoriser/
├── package.json          ← app dependencies
├── public/
│   └── index.html        ← HTML shell + SEO meta tags
└── src/
    ├── index.js          ← React entry point
    └── App.js            ← entire app (all components)
```

---

Built by Mat Judah · Barati Prime (Pty) Ltd · Botswana
Ko-fi: https://ko-fi.com/pstrmatjudah
