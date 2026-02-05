-- Giveaway: one row for "current" campaign. When active = true, it appears on the home featured section.
create table if not exists giveaways (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  image_url text,
  link_url text,
  active boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Single "current" giveaway row (admin edits this row)
insert into giveaways (id, title, description, image_url, link_url, active)
values ('00000000-0000-0000-0000-000000000001'::uuid, null, null, null, null, false)
on conflict (id) do nothing;

alter table giveaways enable row level security;

drop policy if exists "Anyone can view active giveaway" on giveaways;
create policy "Anyone can view active giveaway" on giveaways
  for select using (active = true);
