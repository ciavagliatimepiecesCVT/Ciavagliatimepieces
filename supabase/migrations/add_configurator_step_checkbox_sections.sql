-- Custom checkbox sections per configurator step.
-- Admin can add one or more "checkbox sections" to any step: section name (en/fr), mandatory flag, and multiple checkbox items (names).
-- Which watch types show a section is controlled by configurator_function_step_sections (optional "apply to all watches").

create table if not exists configurator_step_checkbox_sections (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references configurator_steps(id) on delete cascade,
  label_en text not null,
  label_fr text not null,
  mandatory boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists configurator_step_checkbox_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references configurator_step_checkbox_sections(id) on delete cascade,
  label_en text not null,
  label_fr text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Which function options (watch types) have this checkbox section enabled on that step.
-- When admin clicks "Apply to all watches", insert one row per function_option_id that has this step.
create table if not exists configurator_function_step_sections (
  function_option_id uuid not null references configurator_options(id) on delete cascade,
  section_id uuid not null references configurator_step_checkbox_sections(id) on delete cascade,
  primary key (function_option_id, section_id)
);

create index if not exists configurator_step_checkbox_sections_step_id_idx on configurator_step_checkbox_sections(step_id);
create index if not exists configurator_step_checkbox_items_section_id_idx on configurator_step_checkbox_items(section_id);
create index if not exists configurator_function_step_sections_section_id_idx on configurator_function_step_sections(section_id);

alter table configurator_step_checkbox_sections enable row level security;
alter table configurator_step_checkbox_items enable row level security;
alter table configurator_function_step_sections enable row level security;

drop policy if exists "Anyone can view configurator step checkbox sections" on configurator_step_checkbox_sections;
create policy "Anyone can view configurator step checkbox sections" on configurator_step_checkbox_sections for select using (true);

drop policy if exists "Anyone can view configurator step checkbox items" on configurator_step_checkbox_items;
create policy "Anyone can view configurator step checkbox items" on configurator_step_checkbox_items for select using (true);

drop policy if exists "Anyone can view configurator function step sections" on configurator_function_step_sections;
create policy "Anyone can view configurator function step sections" on configurator_function_step_sections for select using (true);

drop policy if exists "Authenticated can manage configurator step checkbox sections" on configurator_step_checkbox_sections;
create policy "Authenticated can manage configurator step checkbox sections" on configurator_step_checkbox_sections for all using (true);

drop policy if exists "Authenticated can manage configurator step checkbox items" on configurator_step_checkbox_items;
create policy "Authenticated can manage configurator step checkbox items" on configurator_step_checkbox_items for all using (true);

drop policy if exists "Authenticated can manage configurator function step sections" on configurator_function_step_sections;
create policy "Authenticated can manage configurator function step sections" on configurator_function_step_sections for all using (true);

comment on table configurator_step_checkbox_sections is 'Checkbox sections that can be shown on a configurator step. Admin sets section name, mandatory, and items.';
comment on table configurator_step_checkbox_items is 'Individual checkbox options within a section (label en/fr).';
comment on table configurator_function_step_sections is 'Which watch types (function options) show which checkbox section on a step. "Apply to all watches" fills this for all functions that have the step.';
