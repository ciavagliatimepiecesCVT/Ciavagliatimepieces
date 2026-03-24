-- Restores default watch categories after manual deletes. Does not touch products.
insert into watch_categories (slug, label_en, label_fr, sort_order)
values
  ('stealth', 'Stealth', 'Stealth', 1),
  ('sub-gmt', 'Sub/GMT', 'Sub/GMT', 2),
  ('chronograph', 'Chronograph', 'Chronographe', 3),
  ('44mm-diver', '44mm Diver', '44mm Diver', 4),
  ('others', 'Others+', 'Others+', 5),
  ('dj', 'DJ', 'DJ', 6),
  ('dd', 'DD', 'DD', 7),
  ('naut', 'Naut', 'Naut', 8),
  ('oak', 'Oak', 'Oak', 9),
  ('g-oak', 'G-OAK', 'G-OAK', 10),
  ('sky', 'Sky', 'Sky', 11)
on conflict (slug) do update set label_en = excluded.label_en, label_fr = excluded.label_fr, sort_order = excluded.sort_order;
