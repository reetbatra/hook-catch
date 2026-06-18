# hookcatch

Debug webhooks in real time. Generate a unique URL, point any webhook at it, and watch every request arrive live. Inspect headers, replay events, verify signatures — no account required.

## Features

- **Instant URL generation** — one click, no signup
- **Live capture** — any HTTP method, any payload, within 2 seconds
- **Full inspection** — headers, body, source IP, query params
- **Replay** — resend any event to your local server, staging, or any URL
- **Signature verification** — Stripe, GitHub, and generic HMAC-SHA256
- **Read-only sharing** — share a view-only link with teammates
- **Auto-expiry** — all data deleted after 24 hours

## Tech Stack

- Next.js 15 (App Router)
- Supabase (Postgres + Realtime)
- Tailwind CSS + shadcn/ui
- Deployed on Vercel

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a free project.

### 2. Run the schema

In your Supabase SQL Editor, run the contents of `supabase/schema.sql`.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL, anon key, and service role key from:
**Project Settings → API**

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
vercel deploy
```

Add environment variables in the Vercel dashboard. The cleanup cron (defined in `vercel.json`) runs hourly to delete expired endpoints.

## How it works

1. Click "Generate webhook URL" → creates a DB row with a unique ID
2. Copy the catcher URL (e.g. `hookcatch.dev/h/abc123`) and paste it as your webhook destination
3. Open the dashboard (`/d/abc123`) — events appear within 2 seconds
4. Click any event to expand headers and body
5. Use **Replay** to resend the payload to your local dev server
6. Use **Verify** to check the HMAC signature against your webhook secret

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/h/[id]` | ANY | Webhook catcher — accepts all methods |
| `/api/endpoints` | POST | Create a new endpoint |
| `/api/events/[endpointId]` | GET | List events for an endpoint |
| `/api/replay` | POST | Replay an event to a target URL |
| `/api/verify` | POST | Verify an event's HMAC signature |
| `/api/cleanup` | GET/POST | Delete expired endpoints (cron target) |
