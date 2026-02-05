-- Add image to configurator steps (e.g. step hero / preview per step).
alter table configurator_steps
  add column if not exists image_url text;

comment on column configurator_steps.image_url is 'Optional image URL for this step (shown in configurator for this step).';
