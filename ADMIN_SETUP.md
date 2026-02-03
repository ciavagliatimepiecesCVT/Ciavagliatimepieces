# Admin & Product Management Setup

Your friend can manage products, prices, and stock from the **Admin** page after signing in.

## 1. Run the Supabase migration

Apply the updated schema (adds `products` table and seeds initial watches):

```bash
# In Supabase Dashboard: SQL Editor → paste supabase/schema.sql → Run
# Or via CLI: supabase db push
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
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_USER_IDS` (new)

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
