-- Per-category visibility flags for the navbar and the homepage "Select your style" cards.
alter table watch_categories
  add column if not exists show_in_navbar boolean not null default true;

alter table watch_categories
  add column if not exists show_on_homepage boolean not null default true;

-- Preserve existing behaviour: "womens" was previously filtered out of the homepage in code.
update watch_categories set show_on_homepage = false where slug = 'womens';
