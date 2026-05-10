-- Add built_preview_image_url to configurator_options.
-- Used on the function step to show the customer what a fully-built watch could look like
-- as inspiration. Only displayed while the user is on the function step; reverts to the
-- composed skeleton on Next.
alter table configurator_options
  add column if not exists built_preview_image_url text;

comment on column configurator_options.built_preview_image_url is 'Function-only: full watch inspiration image shown on the function step in the configurator. Hidden once the user advances past the function step.';
