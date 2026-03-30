-- FlagShip shipping: product dimensions/weight + order shipment fields

ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lb numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_in numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_in numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_in numeric;

COMMENT ON COLUMN products.weight_lb IS 'Shipping weight in pounds (nullable; fallback rules apply if missing).';
COMMENT ON COLUMN products.length_in IS 'Package length in inches (nullable).';
COMMENT ON COLUMN products.width_in IS 'Package width in inches (nullable).';
COMMENT ON COLUMN products.height_in IS 'Package height in inches (nullable).';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_service text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS flagship_shipment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_status text;

COMMENT ON COLUMN orders.shipping_carrier IS 'Display carrier name (e.g. FedEx) from checkout or FlagShip.';
COMMENT ON COLUMN orders.shipping_service IS 'Human-readable service name from checkout or FlagShip.';
COMMENT ON COLUMN orders.shipping_cost IS 'Quoted or invoiced shipping amount in order currency context (CAD for FlagShip).';
COMMENT ON COLUMN orders.flagship_shipment_id IS 'FlagShip shipment id after label purchase.';
COMMENT ON COLUMN orders.shipping_label_url IS 'URL to regular PDF label (or storage path if mirrored).';
COMMENT ON COLUMN orders.shipment_status IS 'e.g. quoted | created | label_failed | unknown';

CREATE UNIQUE INDEX IF NOT EXISTS orders_flagship_shipment_id_key
  ON orders (flagship_shipment_id)
  WHERE flagship_shipment_id IS NOT NULL AND flagship_shipment_id <> '';
