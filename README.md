# Noor AI — Cloudflare Deployment Guide

Built by Saadat. Bilingual (Persian/English) AI chat platform.

**Auth:** username + password only — no email, no OAuth, no verification step.
**AI model:** a single model, Gemma 4 (26B MoE) via the Gemini API free tier.

---

## 1. Cloudflare Setup

### Create D1 Database
```bash
npx wrangler d1 create noor-ai-db
```
Copy the `database_id` into `wrangler.toml`.

### Apply Schema
```bash
npx wrangler d1 execute noor-ai-db --file=./schema.sql
```

### Create KV Namespace
```bash
npx wrangler kv namespace create NOORAI_KV
npx wrangler kv namespace create NOORAI_KV --preview
```
Copy both IDs into `wrangler.toml`.

---

## 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:
```env
GOOGLE_AI_API_KEY=AIza...     # from aistudio.google.com — free tier
HUGGINGFACE_API_KEY=hf_...    # from huggingface.co/settings/tokens
```

Add the same two variables in the Cloudflare Pages dashboard under
**Settings → Environment Variables** for production.

---

## 3. Local Development

```bash
npm install --legacy-peer-deps
npm run dev
```

For full local testing with real D1/KV bindings:
```bash
npm run build:cf
npm run preview
```

---

## 4. Deploy to Cloudflare Pages

```bash
npm run build:cf
npx wrangler pages deploy .vercel/output/static --project-name=noor-ai
```

Or connect your GitHub repo to Cloudflare Pages with:
- **Build command:** `npm run build:cf`
- **Build output directory:** `.vercel/output/static`
- **Node.js version:** 18+

---

## 5. Bind KV & D1 in Cloudflare Pages

Dashboard → your project → Settings → Functions:
- KV namespace binding: `NOORAI_KV`
- D1 database binding: `NOORAI_DB`

---

## Auth model

Registration only needs:
- **Username** — 3-20 characters, letters/numbers/underscore only
- **Password** — minimum 6 characters

No email, no confirmation link, no OAuth provider. Password is hashed
(SHA-256) before being stored in D1; sessions are 30-day tokens cached in KV
for fast validation.

---

## AI model

Only one model is wired up: **`gemma-4-26b-a4b-it`** (Gemma 4, 26B
Mixture-of-Experts variant), called through the Gemini API
(`@google/generative-ai` SDK) using your `GOOGLE_AI_API_KEY`.

This is Google's efficient/free-tier-friendly Gemma 4 variant. If you want
the larger flagship instead, open `lib/ai/gemma.ts` and change `MODEL_NAME`
to `gemma-4-31b-it` (31B dense — higher quality, heavier on quota).

---

## Rate Limits (enforced via KV)

| Resource | Free Limit |
|----------|-----------|
| Chat messages | 50/user/day |
| Image generation | 5/user/day |

---

## Tech Stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Runtime:** Cloudflare Pages + Workers (edge runtime)
- **AI:** Gemma 4 (26B MoE) via Google AI Studio / Gemini API
- **Image Gen:** FLUX.1-schnell via HuggingFace
- **DB:** Cloudflare D1 (SQLite)
- **Cache/Sessions:** Cloudflare KV
- **i18n:** next-intl (fa RTL + en LTR)
