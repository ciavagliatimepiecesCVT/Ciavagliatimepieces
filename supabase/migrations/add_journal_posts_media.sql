-- Optional cover image and video (YouTube/Vimeo URL or direct .mp4/.webm link) for journal / blog posts.
alter table journal_posts
  add column if not exists image_url text,
  add column if not exists video_url text;
