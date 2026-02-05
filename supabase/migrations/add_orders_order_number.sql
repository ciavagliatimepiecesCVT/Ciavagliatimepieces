-- Add order_number for customer-facing tracking (e.g. CT-A1B2C3D4)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text UNIQUE;

-- Backfill existing orders: CT- + first 8 chars of id (no dashes), uppercase
UPDATE orders
SET order_number = 'CT-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE order_number IS NULL;

-- Optional: create index for lookup by order_number
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON orders (order_number) WHERE order_number IS NOT NULL;
