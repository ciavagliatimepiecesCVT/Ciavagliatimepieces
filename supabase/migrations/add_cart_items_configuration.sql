-- Allow cart items to store custom configurator builds (product_id = 'custom-<uuid>').
alter table cart_items
  add column if not exists configuration jsonb;

comment on column cart_items.configuration is 'For custom configurator builds: { steps, extras, addonIds }. Null for regular product items.';
