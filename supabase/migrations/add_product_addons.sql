-- Tailored Extras: optional add-ons for pre-built products (e.g. Extra Rubber Strap, Engraving).
-- Each addon has multiple options (e.g. "Rose Steel / Black", "Oyst / Rose") with their own price.
create table if not exists product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  label_en text not null,
  label_fr text not null,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists product_addon_options (
  id uuid primary key default gen_random_uuid(),
  addon_id uuid not null references product_addons(id) on delete cascade,
  label_en text not null,
  label_fr text not null,
  price numeric not null default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists product_addons_product_id_idx on product_addons(product_id);
create index if not exists product_addon_options_addon_id_idx on product_addon_options(addon_id);

alter table product_addons enable row level security;
alter table product_addon_options enable row level security;

create policy "Anyone can view product addons"
  on product_addons for select using (true);

create policy "Anyone can view product addon options"
  on product_addon_options for select using (true);

comment on table product_addons is 'Tailored Extras: add-ons for pre-built watches (e.g. Extra Rubber Strap, Engraving).';
comment on table product_addon_options is 'Options/variants per add-on with label and price (e.g. Rose Steel / Black $105).';
