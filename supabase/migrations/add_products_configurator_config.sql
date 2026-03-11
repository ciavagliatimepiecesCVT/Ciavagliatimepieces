-- Optional configurator preset per product: when set, "Edit now" on the product page
-- opens the configurator at the final step with these parts pre-selected.
-- Same shape as cart_items.configuration for configurator builds: { steps, addonIds?, dropdownSelections? }.
alter table products
  add column if not exists configurator_config jsonb default null;

comment on column products.configurator_config is 'Optional configurator preset: { steps: string[], addonIds?: string[], dropdownSelections?: Record<string, string> }. When set, Edit now opens configurator at final step with these parts.';
