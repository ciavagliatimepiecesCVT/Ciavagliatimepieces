# Admin & Product Management Setup

Your friend can manage products, prices, and stock from the **Admin** page after signing in.

## 1. Run the Supabase migration

Apply the updated schema (adds `products` table with `category` for watch styles, and seeds initial watches):

```bash
# In Supabase Dashboard: SQL Editor → paste supabase/schema.sql → Run
# Or via CLI: supabase db push
```

If you already have the `products` table, add the category column if needed:

```sql
alter table products add column if not exists category text;
```

If you had the previous seed (Obsidian Atelier, Aria Chrono, Vento GMT) and want to switch to the new models (Stealth, Chronograph, Sub/GMT), run the full schema seed; then remove the old products in Supabase Dashboard → Table Editor → products, or run:

```sql
delete from products where id in ('obsidian-atelier','aria-chrono','vento-gmt');
```

## 2. Add your friend as admin

1. Your friend signs up and logs in to the site.
2. In Supabase Dashboard → **Authentication** → **Users** → copy their **User UID**.
3. In `.env.local`, add:

```
ADMIN_USER_IDS=their-user-uuid-here
```

For multiple admins, use commas:

```
ADMIN_USER_IDS=uuid1,uuid2,uuid3
```

## 3. Environment variables

Ensure these are set (you likely already have them):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (see **Stripe webhook** below)
- `ADMIN_USER_IDS` (new)

### Stripe webhook (required for orders to appear)

When a customer pays, Stripe sends a `checkout.session.completed` event to your site. If that webhook fails, **no order is saved** and **no confirmation email is sent**. Fix it so orders show in Admin and emails can be sent:

1. In **Stripe Dashboard** → **Developers** → **Webhooks** → add endpoint (or use existing).
2. Endpoint URL: `https://yourdomain.com/api/webhook` (must be **HTTPS**; use your real domain, e.g. `https://ciavagliatimepieces.ca/api/webhook`).
3. Select event: **checkout.session.completed** (or “All events” if you prefer).
4. After saving, open the endpoint and copy the **Signing secret** (`whsec_...`).
5. In your **production** env (e.g. Vercel), set `STRIPE_WEBHOOK_SECRET` to that exact value. Do **not** use the temporary secret from `stripe listen` (CLI) in production.
6. Redeploy. In Stripe → Webhooks → your endpoint → **Recent deliveries**, failed events should turn green once the secret matches.

### Order confirmation emails (optional)

To send “Your order is confirmed” to the customer and “New order received” to you:

1. Set these in your **production** env (e.g. Vercel):
   - `SMTP_HOST` (e.g. `smtp.resend.com`)
   - `SMTP_PORT` (e.g. `587`)
   - `SMTP_USER` (e.g. `resend`)
   - `SMTP_PASS` (your provider’s password/API key)
   - `SMTP_FROM` (e.g. `orders@yourdomain.com`)
   - `ORDER_NOTIFY_EMAIL` (optional; where to receive “New order” notifications; default: `atelier@civagliatimepieces.com`)
2. If SMTP is not set, orders are still saved and shown in Admin; only emails are skipped.

## Journal (blog)

Admins can add, edit, and delete journal posts from the **Admin** page. Scroll to the **Journal** section below products. Each post has a title, excerpt, optional body, and locale (en/fr). The public **Journal** page (`/en/blog` or `/fr/blog`) shows posts for the current locale. Run the full schema in Supabase to create the `journal_posts` table and seed three sample posts.

## Configurator (custom watch builder)

The **Configurator** lets customers build a watch by choosing function (watch type), size (if applicable), case, dial, hands, strap, and optional extra/add-ons. All options and prices are stored in Supabase; Stripe checkout uses the **server-calculated** price from the database (never the client).

1. **Run the configurator migration** (adds `step_key`, `optional` to `configurator_steps`, and `configurator_function_steps` table):
   - In Supabase Dashboard → **SQL Editor**, run the contents of `supabase/migrations/configurator_function_steps.sql`.
   - This backfills step keys (function, size, case, dial, hands, strap, extra) and adds the Size step if missing.

2. **Admin → Configurator** (`/en/account/admin/configurator` or `/fr/account/admin/configurator`):
   - **Watch types (Functions)** – Options of the “Function” step (e.g. Oak, Naut, Skeleton). For each type, click “Steps for this type” and check/reorder which steps follow (Size, Case, Dial, Hands, Strap, Extra).
   - **Steps** – Add or edit steps (label EN/FR, step_key, optional). Step keys: `function`, `size`, `case`, `dial`, `hands`, `strap`, `extra`.
   - **Options by step** – For each step, add options (label, letter, price). Use “For function (empty = all)” to show an option only for a specific watch type (e.g. “Exhibition Back” only for Skeleton).
   - **Optional add-ons** – e.g. Frosted Finish on the Case step. Create the add-on, then assign which case options show it (e.g. stainless steel, yellow gold, rose gold, black).

3. **Customer flow** – The public configurator (`/en/configurator` or `/fr/configurator`) loads all data from Supabase. When the customer checks out, the server recalculates the total from the database and creates the Stripe session with that amount.

## Product images (upload)

Admins can **upload their own images** when adding or editing products. Use "Choose file" in the Image field (or paste an image URL). Images are stored in Supabase Storage in a bucket named `product-images`. The bucket is created automatically on first upload; if you prefer to create it manually, in Supabase Dashboard go to **Storage** → **New bucket** → name `product-images`, set to **Public**. Max file size 5MB; formats JPEG, PNG, WebP, GIF.

## How it works

- **Shop** – Products are loaded from Supabase `products` table.
- **Admin** (`/en/account/admin` or `/fr/account/admin`) – Admins can:
  - View all products (active and inactive)
  - Edit price, stock, description, image
  - Add new products
  - Delete products
  - Toggle visibility (active/hidden)
- **Stock** – Checkout blocks purchases when stock is 0. Stock is decremented automatically when Stripe payment succeeds (webhook).

## Email limit rate exceeded (Supabase Auth)

If someone sees **"Email limit rate exceeded"** when signing up or resetting a password, Supabase’s built-in auth emails have hit their (low) free-tier limit.

**Fix: use Custom SMTP** so sign-up and password-reset emails go through your own provider instead of Supabase’s:

1. In **Supabase Dashboard** → **Project Settings** (gear) → **Auth** → **SMTP Settings**.
2. Enable **Custom SMTP** and fill in your provider’s details, for example:
   - **Resend**: [resend.com](https://resend.com) – free tier is generous; use SMTP or their API. For SMTP: host `smtp.resend.com`, port `465` (SSL) or `587` (TLS), username `resend`, password = your Resend API key.
   - **SendGrid**, **Mailgun**, **Brevo**, etc.: use the SMTP host, port, username, and password from that provider.
3. Set **Sender email** to a verified address (e.g. `noreply@yourdomain.com` or the address your provider allows).
4. Save. New sign-ups and password resets will use your SMTP and no longer count against Supabase’s built-in email limit.

Your app’s `.env` SMTP vars (e.g. `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are for **order/notification emails** in your code. Supabase Auth SMTP is configured only in the Supabase Dashboard and is separate from those vars.

## Note on auth

If the Admin page shows "Unauthorized", check:

1. The user is logged in.
2. Their User UID is in `ADMIN_USER_IDS`.
3. Auth cookies are working (Supabase SSR is configured).
