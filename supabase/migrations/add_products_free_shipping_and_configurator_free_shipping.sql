-- Free shipping: per-product (prebuilt watches) and site-wide for configurator builds
alter table products add column if not exists free_shipping boolean not null default false;

insert into site_settings (key, value) values ('configurator_free_shipping', 'false')
on conflict (key) do nothing;
