-- Watch bands / colorways for pre-built products. Admin adds image + title per band; customer picks one on product page.
create table if not exists product_bands (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  title text not null,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists product_bands_product_id_idx on product_bands(product_id);

alter table product_bands enable row level security;

-- Public can read bands for active products (product page)
create policy "Anyone can view product bands"
  on product_bands for select using (true);

-- Admin write via service role only (no anon/authenticated insert/update/delete)

comment on table product_bands is 'Band/colorway options for pre-built watches. Admin sets title + image; customer selects on product page.';
