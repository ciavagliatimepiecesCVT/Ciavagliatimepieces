-- Phone collected at Stripe Checkout; used for admin, couriers, and FlagShip confirm.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;

COMMENT ON COLUMN orders.customer_phone IS 'Customer phone from Stripe Checkout (phone_number_collection); used for shipping/FlagShip.';
