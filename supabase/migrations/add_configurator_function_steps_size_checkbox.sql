-- Allow a "Size" selector to be shown on any step instead of a dedicated Size step.
-- When has_size_checkbox is true for a (function_option_id, step_id), the customer sees
-- size options (from the Size step's options) on that step. size_checkbox_mandatory
-- controls whether a size must be selected to continue.

alter table configurator_function_steps
  add column if not exists has_size_checkbox boolean not null default false;

alter table configurator_function_steps
  add column if not exists size_checkbox_mandatory boolean not null default false;

comment on column configurator_function_steps.has_size_checkbox is 'When true, show size options (from Size step) on this step as a checkbox/selector.';
comment on column configurator_function_steps.size_checkbox_mandatory is 'When has_size_checkbox is true, whether the customer must select a size to continue.';
