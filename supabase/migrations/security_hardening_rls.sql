-- Security hardening (2026-06): lock down tables that anonymous or any signed-in
-- user could write to. All admin writes go through the server's service-role key,
-- which bypasses RLS, so removing these client write policies breaks nothing.

-- 1. site_settings had NO row level security: anyone with the anon key could
--    read AND change the configurator discount / free-shipping flags.
alter table site_settings enable row level security;
drop policy if exists "Anyone can view site settings" on site_settings;
create policy "Anyone can view site settings" on site_settings
  for select using (true);
-- No insert/update/delete policies: client writes are denied by default.

-- 2. addon_templates / addon_template_options: "for all using (true)" let even
--    anonymous visitors rewrite the add-on library (labels, PRICES, images).
drop policy if exists "Admin can manage addon_templates" on addon_templates;
drop policy if exists "Admin can manage addon_template_options" on addon_template_options;
drop policy if exists "Anyone can view addon_templates" on addon_templates;
create policy "Anyone can view addon_templates" on addon_templates
  for select using (true);
drop policy if exists "Anyone can view addon_template_options" on addon_template_options;
create policy "Anyone can view addon_template_options" on addon_template_options
  for select using (true);

-- 3. Configurator content tables: any signed-in customer could edit option
--    groups, dropdown items (with prices), checkbox sections, and layer
--    transforms. Reads stay public via their existing "Anyone can view" policies.
drop policy if exists "Authenticated can manage configurator option groups" on configurator_option_groups;
drop policy if exists "Authenticated can manage configurator dropdown items" on configurator_dropdown_items;
drop policy if exists "Authenticated can manage configurator layer transforms" on configurator_layer_transforms;
drop policy if exists "Authenticated can manage configurator step checkbox sections" on configurator_step_checkbox_sections;
drop policy if exists "Authenticated can manage configurator step checkbox items" on configurator_step_checkbox_items;
drop policy if exists "Authenticated can manage configurator function step sections" on configurator_function_step_sections;

-- 4. review-images bucket: uploads stay open for the public review form, but cap
--    file size (5 MB) and restrict to image MIME types to prevent abuse.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
where id = 'review-images';
