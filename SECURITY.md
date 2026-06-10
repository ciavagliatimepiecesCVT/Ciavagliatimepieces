# Security Implementation

This document outlines the security measures in place to protect the Ciavaglia Timepieces website.

## ✅ Current Security Measures

### 1. **Authentication & Authorization**
- ✅ **Supabase Auth** – Industry-standard authentication with JWT tokens
- ✅ **Cookie-based sessions** – Secure, httpOnly cookies (via `@supabase/ssr`)
- ✅ **Admin verification** – Server-side check of `ADMIN_USER_IDS` on every admin action
- ✅ **Session refresh** – Middleware automatically refreshes expired tokens

### 2. **Database Security (Row Level Security)**
- ✅ **RLS enabled** on all tables (profiles, configurations, orders, cart_items, products)
- ✅ **Users can only access their own data**:
  - Profiles: users can only view/edit their own profile
  - Orders: users can only view their own orders
  - Cart: users can only view/edit/delete their own cart items
  - Configurations: users can only view/insert their own configurations
- ✅ **Products**: Public can only read active products; writes require service role (admin)
- ✅ **Service role** used for admin operations (bypasses RLS securely)

### 3. **Admin Panel Protection**
- ✅ **Server-side auth check** – Every admin action verifies user is in `ADMIN_USER_IDS`
- ✅ **Input validation**:
  - Product names: max 200 chars
  - Product IDs: max 100 chars, alphanumeric + hyphens only
  - Prices: 0 to 1,000,000
  - Stock: 0 to 100,000
- ✅ **Service role for DB writes** – Admin actions use service role, not user credentials
- ✅ **Error handling** – Throws errors on unauthorized access

### 4. **Payment Security (Stripe)**
- ✅ **Webhook signature verification** – Stripe webhooks are verified with `STRIPE_WEBHOOK_SECRET`
- ✅ **Server-side price recomputation** – Every checkout path (single product, logged-in cart, guest cart, custom builds, add-ons) recomputes prices from the database; client/cart-stored prices are never trusted
- ✅ **Fail-closed custom pricing** – If a custom build can't be priced server-side, checkout is rejected (no client-price fallback)
- ✅ **HMAC-signed shipping quotes** – `/api/shipping/quote` signs each rate (price + carrier + 30-min expiry); checkout rejects unsigned/tampered/expired selections
- ✅ **Session-derived identity** – Checkout takes the user ID from the auth cookie, never from the request body
- ✅ **Stock validation** – Checkout blocks purchases when stock < quantity
- ✅ **Stripe handles PCI compliance** – No credit card data touches your server

### 5. **API Security**
- ✅ **Type validation** – Checkout validates `type` is "custom" or "built"
- ✅ **Error handling** – Try-catch blocks prevent info leakage
- ✅ **Service role for sensitive operations** – Admin and webhook use service role key
- ✅ **HTTPS enforced** – All API calls require HTTPS in production

### 6. **Environment Variables**
- ✅ **Secrets in `.env.local`** – Never committed to git (`.gitignore` includes `.env*`)
- ✅ **Service role key** – Only used server-side, never exposed to client
- ✅ **Webhook secret** – Validates Stripe webhook authenticity
- ✅ **Admin IDs** – Server-only, client never sees who is admin

### 7. **SQL Injection Prevention**
- ✅ **Parameterized queries** – Supabase client uses prepared statements
- ✅ **No raw SQL from user input** – All queries use Supabase query builder
- ✅ **Input sanitization** – IDs and names sanitized before DB operations

## 🔒 Additional Recommendations

### Implemented (Hardening)

1. **Rate Limiting** (`src/proxy.ts`)
   - **Checkout:** 15 requests/minute per IP
   - **Track order:** 20 requests/minute per IP
   - **Contact form:** 5 requests/minute per IP
   - **Shipping quotes:** 20 requests/minute per IP
   - **Exchange rate / share-image:** 30–60 requests/minute per IP
   - **Login / Sign-up pages:** 30 requests/minute per IP (limits automated probing)
   - Uses in-memory store per Edge instance; for strict cross-instance limits, add Upstash Redis

2. **Security Headers** (`next.config.ts`)
   - **X-Frame-Options:** DENY (clickjacking)
   - **X-Content-Type-Options:** nosniff
   - **Referrer-Policy:** strict-origin-when-cross-origin
   - **Permissions-Policy:** camera, microphone, geolocation disabled
   - **Content-Security-Policy:** Restricts scripts, frames, connections to self, Supabase, Stripe

### For Production Deployment (Optional)

1. **CORS Configuration**
   - Ensure API routes only accept requests from your domain
   - Configure in `next.config.ts` or API middleware if you need stricter CORS

2. **Monitoring & Alerts**
   - Set up Sentry or similar for error tracking
   - Monitor failed admin login attempts
   - Alert on unusual Stripe webhook activity

3. **Regular Updates**
   - Keep dependencies updated (`npm audit`, `npm update`)
   - Monitor Supabase and Stripe security advisories

4. **Backup Strategy**
   - Enable Supabase automatic backups
   - Export product data regularly

### Hardening pass (June 2026)

- **Checkout**: all prices (cart, guest cart, add-ons, custom builds) recomputed server-side; client-sent `userId` ignored in favor of the session cookie; shipping selections must carry a valid server HMAC signature.
- **Order tracking** (`/api/track-order`): now requires the order number AND the purchase email; identical 404 for unknown order vs. email mismatch so order numbers can't be enumerated.
- **Contact form**: full HTML entity escaping, CR/LF stripped from header-bound fields, length limits (name 200, email 320, message 5000).
- **Share-image endpoint**: UUID format enforced; redirect restricted to same-site paths (was an open redirect via user-supplied `image_url`).
- **Admin**: `/account/admin` layout verifies admin status server-side (all server actions already did); `/api/test-email` additionally requires an admin session.
- **Login**: redirect parameter restricted to same-site paths (blocks `//evil.com`).
- **CSP**: `'unsafe-eval'` only emitted in development; Meta pixel ID validated as numeric before being inlined in a script.
- **Database** (`supabase/migrations/security_hardening_rls.sql` — ⚠️ must be run in the Supabase SQL editor):
  - `site_settings` had no RLS (anyone could change the configurator discount) → RLS enabled, read-only for clients.
  - `addon_templates` / `addon_template_options` were writable by **anonymous** visitors → read-only for clients.
  - Six configurator content tables were writable by any signed-in customer → read-only for clients (admin writes use the service role).
  - `review-images` storage bucket capped at 5 MB and image MIME types only.

## 🚨 Security Checklist Before Going Live

- [ ] `.env.local` is in `.gitignore` and never committed
- [ ] `ADMIN_USER_IDS` is set and kept secret
- [ ] `STRIPE_WEBHOOK_SECRET` is configured correctly
- [ ] Supabase RLS policies are enabled (run `schema.sql`)
- [ ] HTTPS is enforced (automatic on Vercel/Netlify)
- [ ] Admin user has a strong password
- [ ] Supabase project has 2FA enabled
- [ ] Stripe is in live mode with proper keys
- [ ] Test admin panel with non-admin user (should be blocked)
- [ ] Test checkout with invalid product IDs (should fail)
- [ ] Test webhook with invalid signature (should reject)

## 🛡️ What's Protected

| Attack Vector | Protection |
|--------------|-----------|
| **Unauthorized admin access** | Server-side `ADMIN_USER_IDS` check on every action |
| **Price manipulation** | Server fetches price from DB, client can't override |
| **Stock manipulation** | Server validates stock before checkout |
| **SQL injection** | Parameterized queries via Supabase client |
| **Session hijacking** | httpOnly cookies, automatic refresh |
| **Fake webhooks** | Stripe signature verification |
| **Data leakage** | RLS ensures users only see their own data |
| **XSS attacks** | React escapes output by default |
| **CSRF attacks** | SameSite cookies, Supabase CSRF protection |

## 📧 Reporting Security Issues

If you discover a security vulnerability, please email security@civagliatimepieces.com (or your contact email) instead of opening a public issue.
