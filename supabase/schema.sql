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
