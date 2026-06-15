# FinScore Canada 🍁

AI-powered personal credit and financial optimization advisor for Canadians.

## Setup

1. **Add your Anthropic API key** in Vercel:
   - Go to your Vercel project → Settings → Environment Variables
   - Add: `ANTHROPIC_API_KEY` = `sk-ant-...`

2. **Redeploy** after adding the key.

## How it works

- Client fills a 5-section intake form (income, expenses, credit cards, debts, goals)
- On submit, Next.js API route calls Anthropic server-side (no CORS issues, key stays secret)
- Claude generates a full personalized report rendered directly on the page
- Client can print / save as PDF

## Stack

- Next.js 14 (Pages Router)
- Anthropic SDK (`@anthropic-ai/sdk`)
- Zero external UI libraries — pure inline styles

## Local development

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev
```
