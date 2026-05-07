alter table public.graphics
  add column if not exists slug text;

alter table public.videos
  add column if not exists slug text;

update public.graphics
set slug = lower(regexp_replace(regexp_replace(trim(title), '\s+', '-', 'g'), '[^a-zA-Z0-9_-]', '', 'g'))
where coalesce(trim(slug), '') = '';

update public.videos
set slug = lower(regexp_replace(regexp_replace(trim(title), '\s+', '-', 'g'), '[^a-zA-Z0-9_-]', '', 'g'))
where coalesce(trim(slug), '') = '';

create index if not exists graphics_slug_idx
  on public.graphics (slug);

create index if not exists videos_slug_idx
  on public.videos (slug);
