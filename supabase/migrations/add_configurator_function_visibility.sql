alter table configurator_options
add column if not exists is_visible boolean not null default true;

update configurator_options
set is_visible = true
where is_visible is null;
