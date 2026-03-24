-- Remove categories that only existed in the old schema seed. Real inventory uses admin-created rows
-- (e.g. dj, womens, sub-gmt, chronograph, oak, san). Safe to re-run.
delete from watch_categories
where slug in (
  'stealth',
  '44mm-diver',
  'others',
  'dd',
  'naut',
  'g-oak',
  'sky'
);
