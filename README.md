# Civaglia Timepieces

A luxury watch ecommerce experience with bilingual routing (EN/FR), animated storytelling home page, custom configurator, Supabase auth + database cart, and Stripe Checkout.

## Features
- Locale routing for English and French (`/en`, `/fr`)
- Scroll-reactive navigation bar (hide on scroll down, show on scroll up)
- Hero-driven homepage with scroll reveal + parallax
- Built watches shop + configurator checkout
- Supabase Auth, cart storage, configurations, and order history
- Stripe Checkout with webhook for order capture
- SMTP order emails (customer + atelier) and Stripe receipt emails

## Setup
1) Install dependencies
```bash
npm install
```

2) Create `.env.local` from the example
```bash
cp .env.local.example .env.local
```

3) Supabase
- Create a new Supabase project
- Run the SQL in `supabase/schema.sql`
- Create a storage bucket named `watch-images` (optional for uploaded watch renders)
- Configure SMTP for Supabase Auth emails (Project Settings → Auth → SMTP)

4) Stripe
- Create a Stripe account and add `STRIPE_SECRET_KEY`
- Create a webhook endpoint pointing to `/api/webhook`
- Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
- Enable email receipts in Stripe Dashboard

5) Run the dev server
```bash
npm run dev
```

Open `http://localhost:3000` and you will be redirected to `/en`.

## Project structure
- `src/app/[locale]/*` locale-specific pages
- `src/components/*` UI components and motion helpers
- `src/lib/*` Supabase, Stripe, and email helpers
- `supabase/schema.sql` database schema

## Notes
- Orders are finalized via Stripe webhooks. Make sure the webhook is reachable in production.
- Custom configuration data is stored in the `configurations` table.
- Cart items are stored in Supabase under `cart_items`.
