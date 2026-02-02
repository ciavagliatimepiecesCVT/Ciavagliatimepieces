-- Civaglia Timepieces schema
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  shipping_address text,
  city text,
  country text,
  postal_code text,
  preferences text,
  created_at timestamptz default now()
);

create table if not exists configurations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  type text not null,
  options jsonb,
  status text default 'pending',
  price numeric,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid references configurations,
  user_id uuid references auth.users,
  total numeric,
  status text,
  summary text,
  stripe_session_id text,
  created_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  image text,
  stock integer default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  product_id text not null,
  quantity integer default 1,
  price numeric,
  title text,
  image_url text,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

alter table products enable row level security;
alter table profiles enable row level security;
alter table configurations enable row level security;
alter table orders enable row level security;
alter table cart_items enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can view own configurations" on configurations
  for select using (auth.uid() = user_id);

create policy "Users can insert own configurations" on configurations
  for insert with check (auth.uid() = user_id);

create policy "Users can view own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users can view own cart" on cart_items
  for select using (auth.uid() = user_id);

create policy "Users can edit own cart" on cart_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update own cart" on cart_items
  for update using (auth.uid() = user_id);

create policy "Users can delete own cart items" on cart_items
  for delete using (auth.uid() = user_id);

-- Products: public read for active items; admin writes via service role
create policy "Anyone can view active products" on products
  for select using (active = true);

-- Seed initial products (run once; safe to re-run)
insert into products (id, name, description, price, image, stock, active)
values
  ('obsidian-atelier', 'Obsidian Atelier', 'Matte noir case, meteorite dial, smoked sapphire.', 12900, '/images/hero-1.svg', 5, true),
  ('aria-chrono', 'Aria Chrono', 'Rose gold warmth with a column-wheel chronograph.', 15750, '/images/hero-2.svg', 3, true),
  ('vento-gmt', 'Vento GMT', 'Dual-time dial with blue ceramic bezel.', 11800, '/images/hero-3.svg', 4, true)
on conflict (id) do nothing;
