-- Production RLS hardening for the portfolio app.
-- Apply in Supabase SQL editor after verifying table and bucket names.
-- Admin writes are handled by protected Next.js API routes using SUPABASE_SERVICE_ROLE_KEY.

alter table public.site_settings enable row level security;
alter table public.videos enable row level security;
alter table public.graphics enable row level security;
alter table public.categories enable row level security;
alter table public.tutorials enable row level security;
alter table public.experiences enable row level security;

-- Optional CRM/admin data stored in JSON settings is service-role only through API routes.
-- If these tables exist in your project, enable and lock them too.
do $$
begin
  if to_regclass('public.contact_leads') is not null then
    execute 'alter table public.contact_leads enable row level security';
  end if;
  if to_regclass('public.inbox') is not null then
    execute 'alter table public.inbox enable row level security';
  end if;
  if to_regclass('public.messages') is not null then
    execute 'alter table public.messages enable row level security';
  end if;
  if to_regclass('public.projects') is not null then
    execute 'alter table public.projects enable row level security';
  end if;
  if to_regclass('public.page_views') is not null then
    execute 'alter table public.page_views enable row level security';
  end if;
end $$;

drop policy if exists "Public read site settings" on public.site_settings;
drop policy if exists "Public read active categories" on public.categories;
drop policy if exists "Public read visible videos" on public.videos;
drop policy if exists "Public read visible graphics" on public.graphics;
drop policy if exists "Public read visible tutorials" on public.tutorials;
drop policy if exists "Public read visible experiences" on public.experiences;

create policy "Public read site settings"
on public.site_settings
for select
to anon, authenticated
using (
  key not in (
    'twilio_account_sid',
    'twilio_auth_token',
    'twilio_whatsapp_from',
    'admin_password',
    'app_session_secret',
    'supabase_service_role_key'
  )
);

create policy "Public read active categories"
on public.categories
for select
to anon, authenticated
using (active = true);

create policy "Public read visible videos"
on public.videos
for select
to anon, authenticated
using (visible = true);

create policy "Public read visible graphics"
on public.graphics
for select
to anon, authenticated
using (visible = true);

create policy "Public read visible tutorials"
on public.tutorials
for select
to anon, authenticated
using (visible = true);

create policy "Public read visible experiences"
on public.experiences
for select
to anon, authenticated
using (is_visible = true);

-- No anon/authenticated INSERT/UPDATE/DELETE policies are created for admin tables.
-- With RLS enabled, those writes are denied unless done through the service-role API.

-- Storage hardening. Public reads are allowed; writes are service-role only.
-- This covers media, hero images, video thumbnails, SEO images, and graphics uploads.
drop policy if exists "Public read portfolio storage" on storage.objects;
drop policy if exists "No anonymous portfolio uploads" on storage.objects;

create policy "Public read portfolio storage"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('media', 'graphics'));

-- Do not add anon/authenticated insert/update/delete policies for these buckets.
-- The protected route /api/admin/storage-upload uploads with the service role.

-- Contact form note:
-- This app currently submits public contact messages through /api/contact using
-- the service role plus application validation. Keep direct anon writes disabled.
