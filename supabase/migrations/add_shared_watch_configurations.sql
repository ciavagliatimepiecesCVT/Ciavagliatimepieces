create table if not exists shared_watch_configurations (
  id uuid primary key default gen_random_uuid(),
  configuration jsonb not null,
  image_url text,
  preview_data_url text,
  total_price numeric(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists shared_watch_configurations_created_at_idx
  on shared_watch_configurations(created_at desc);

alter table shared_watch_configurations enable row level security;

drop policy if exists "Anyone can read shared watch configurations" on shared_watch_configurations;
create policy "Anyone can read shared watch configurations"
  on shared_watch_configurations
  for select
  using (true);

drop policy if exists "Anyone can insert shared watch configurations" on shared_watch_configurations;
create policy "Anyone can insert shared watch configurations"
  on shared_watch_configurations
  for insert
  with check (true);
