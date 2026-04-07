-- Customer reviews (product-specific or general site reviews).
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text references products(id) on delete set null,
  reviewer_name text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  message text,
  watch_purchased text,
  approved boolean default false,
  created_at timestamptz default now()
);

alter table reviews enable row level security;

drop policy if exists "Anyone can view approved reviews" on reviews;
create policy "Anyone can view approved reviews" on reviews
  for select using (approved = true);

drop policy if exists "Anyone can submit a review" on reviews;
create policy "Anyone can submit a review" on reviews
  for insert with check (true);
