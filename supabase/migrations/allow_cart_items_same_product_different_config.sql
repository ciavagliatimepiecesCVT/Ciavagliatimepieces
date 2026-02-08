-- Allow multiple cart lines for the same product when configuration differs (e.g. different watch band).
-- Drops unique (user_id, product_id) so the same product can appear with different bands.
alter table cart_items
  drop constraint if exists cart_items_user_id_product_id_key;
