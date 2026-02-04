-- Add customer_email and shipping columns to orders if they don't exist
-- (Run this in Supabase SQL Editor if your live DB was created before these columns were added)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_line1 text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_line2 text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country text;
