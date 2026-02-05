-- Courier tracking: add tracking fields to orders (set by admin when package is with carrier)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
