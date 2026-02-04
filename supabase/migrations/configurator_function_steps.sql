-- Configurator: step_key + optional on steps; which steps each function (watch type) has.
-- Steps are identified by step_key: function, size, case, dial, hands, strap, extra.
-- configurator_function_steps defines, for each Function-step option (Oak, Naut, etc.), which steps follow and in what order.

-- Add step_key and optional to configurator_steps
alter table configurator_steps add column if not exists step_key text;
alter table configurator_steps add column if not exists optional boolean default false;

-- Backfill step_key from existing label_en (match by label)
update configurator_steps set step_key = 'function', optional = false where label_en = 'Function';
update configurator_steps set step_key = 'case', optional = false where label_en = 'Case';
update configurator_steps set step_key = 'dial', optional = false where label_en = 'Dial';
update configurator_steps set step_key = 'hands', optional = false where label_en = 'Hands';
update configurator_steps set step_key = 'strap', optional = false where label_en = 'Strap';
update configurator_steps set step_key = 'extra', optional = true where label_en = 'Extra';

-- Insert Size step if not present (step_key size)
insert into configurator_steps (label_en, label_fr, sort_order, step_key, optional)
select 'Size', 'Taille', 2, 'size', false
where not exists (select 1 from configurator_steps where step_key = 'size');

-- Ensure step_key is set for all and add unique constraint
create unique index if not exists configurator_steps_step_key_key on configurator_steps (step_key) where step_key is not null;

-- Table: which steps (and in what order) each "function" (watch type) has.
-- function_option_id = id of an option that belongs to the Function step (e.g. Oak, Naut).
create table if not exists configurator_function_steps (
  function_option_id uuid not null references configurator_options(id) on delete cascade,
  step_id uuid not null references configurator_steps(id) on delete cascade,
  sort_order int not null default 0,
  primary key (function_option_id, step_id)
);

alter table configurator_function_steps enable row level security;

drop policy if exists "Anyone can view configurator function steps" on configurator_function_steps;
create policy "Anyone can view configurator function steps" on configurator_function_steps
  for select using (true);
