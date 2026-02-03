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
- ✅ **Server-side price fetching** – Prices come from Supabase, not client input
- ✅ **Stock validation** – Checkout blocks purchases when stock < 1
- ✅ **No client-side price manipulation** – Client never sends price; server fetches from DB
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

### For Production Deployment:

1. **Rate Limiting** (not implemented yet)
   - Add rate limiting to prevent brute force attacks
   - Consider Vercel Edge Config or Upstash Redis for rate limiting
   - Limit admin actions, checkout, and auth endpoints

2. **CORS Configuration**
   - Ensure API routes only accept requests from your domain
   - Configure in `next.config.ts` or API middleware

3. **Content Security Policy (CSP)**
   - Add CSP headers to prevent XSS attacks
   - Configure in `next.config.ts`

4. **Monitoring & Alerts**
   - Set up Sentry or similar for error tracking
   - Monitor failed admin login attempts
   - Alert on unusual Stripe webhook activity

5. **Regular Updates**
   - Keep dependencies updated (`npm audit`, `npm update`)
   - Monitor Supabase and Stripe security advisories

6. **Backup Strategy**
   - Enable Supabase automatic backups
   - Export product data regularly

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
