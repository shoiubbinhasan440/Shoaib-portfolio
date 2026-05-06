alter table public.categories
  add column if not exists description text,
  add column if not exists cover_image_url text,
  add column if not exists thumbnail_image text,
  add column if not exists icon text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists canonical_url text,
  add column if not exists og_image_url text,
  add column if not exists og_image text,
  add column if not exists show_on_homepage boolean not null default true,
  add column if not exists show_on_portfolio boolean not null default true,
  add column if not exists show_on_portfolio_page boolean not null default true,
  add column if not exists show_filter_chip boolean not null default true,
  add column if not exists featured boolean not null default false,
  add column if not exists featured_category boolean not null default false,
  add column if not exists visibility_status boolean not null default true;

create index if not exists categories_slug_idx
  on public.categories (slug);

create index if not exists categories_type_active_idx
  on public.categories (type, active, order_num);

create index if not exists categories_homepage_visibility_idx
  on public.categories (show_on_homepage, show_filter_chip, active, order_num);

create index if not exists categories_portfolio_visibility_idx
  on public.categories (show_on_portfolio, show_filter_chip, active, order_num);

create index if not exists categories_portfolio_page_visibility_idx
  on public.categories (show_on_portfolio_page, show_filter_chip, visibility_status, order_num);

update public.categories
set
  thumbnail_image = coalesce(thumbnail_image, cover_image_url),
  og_image = coalesce(og_image, og_image_url),
  show_on_portfolio_page = coalesce(show_on_portfolio_page, show_on_portfolio, true),
  featured_category = coalesce(featured_category, featured, false),
  visibility_status = coalesce(visibility_status, active, true);
