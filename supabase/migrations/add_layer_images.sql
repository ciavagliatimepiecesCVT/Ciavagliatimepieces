-- Add layer image support for configurator composite preview.
-- layer_image_url: transparent PNG used in stacked preview (separate from thumbnail image_url).
-- layer_z_index: stacking order (0=base, 10=case, 20=dial, 30=hands, 40=strap).
alter table configurator_options
  add column if not exists layer_image_url text,
  add column if not exists layer_z_index int default 0;

comment on column configurator_options.layer_image_url is 'URL to transparent PNG layer for composite preview (used in stacked watch image).';
comment on column configurator_options.layer_z_index is 'Stacking order for layer in composite preview (0=base, 10=case, 20=dial, 30=hands, 40=strap).';
