-- Allow configurator options to apply to multiple functions (checklist in admin).
-- When for_function_ids is null or empty, option applies to all functions (same as parent_option_id null).
-- When non-empty, option applies only when current function is in the array.
alter table configurator_options
  add column if not exists for_function_ids uuid[] default null;

comment on column configurator_options.for_function_ids is 'When null or empty: option applies to all watch types. When set: option applies only to these function (watch type) option ids.';

-- Backfill: options that had a single parent_option_id now use for_function_ids instead (keep parent_option_id for backward compat until we stop using it in filters).
update configurator_options
set for_function_ids = array[parent_option_id]
where parent_option_id is not null and (for_function_ids is null or cardinality(for_function_ids) = 0);
