-- Persist user-saved custom watch configurations.
create table if not exists saved_watch_configurations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  configuration jsonb not null,
  image_url text,
  total_price numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_watch_configurations_user_id_created_at_idx
  on saved_watch_configurations(user_id, created_at desc);

create or replace function set_saved_watch_configurations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_watch_configurations_set_updated_at on saved_watch_configurations;
create trigger saved_watch_configurations_set_updated_at
before update on saved_watch_configurations
for each row execute function set_saved_watch_configurations_updated_at();

alter table saved_watch_configurations enable row level security;

drop policy if exists "Users can read own saved watch configurations" on saved_watch_configurations;
create policy "Users can read own saved watch configurations"
  on saved_watch_configurations
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved watch configurations" on saved_watch_configurations;
create policy "Users can insert own saved watch configurations"
  on saved_watch_configurations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved watch configurations" on saved_watch_configurations;
create policy "Users can update own saved watch configurations"
  on saved_watch_configurations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved watch configurations" on saved_watch_configurations;
create policy "Users can delete own saved watch configurations"
  on saved_watch_configurations
  for delete
  using (auth.uid() = user_id);

comment on table saved_watch_configurations is 'Authenticated users can save custom watch builds to their account.';
comment on column saved_watch_configurations.configuration is 'Build payload from configurator (steps, addonIds, dropdownSelections, customCheckboxSelections, summaryLines, etc.).';
