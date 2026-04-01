# FlagShip shipping setup

1. Create a SmartShip API token at https://auth.smartship.io/ using your FlagShip account. The token is sent on every request as `X-Smartship-Token` (see https://docs.smartship.io/).

2. Copy variables from `.env.example` into `.env`. Set `FLAGSHIP_API_KEY` to that token. Configure `SHIPPER_*` with your origin address.

3. Run `supabase/migrations/add_flagship_shipping.sql` on your database.

4. **Review order** at `/{locale}/checkout/review` (or `/{locale}/checkout`, which redirects there) collects address and FlagShip rates before Stripe. **Configurator** shows rates when site setting configurator free shipping is off. **Buy now** uses `?type=built&productId=`.

5. **Admin** order detail (`/account/admin/orders/[orderId]`) creates shipments and opens label URLs.
   - When a shipment is created, the order's `customer_email` is sent to FlagShip via `options.shipment_tracking_emails`, so FlagShip/courier tracking emails are sent from the shipping side.

6. HTTP mapping lives in `src/lib/shipping/flagship-adapter.ts` for easy updates.
