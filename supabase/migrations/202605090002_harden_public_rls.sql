-- Harden public read policies after moving admin reads to protected service-role APIs.
-- Safe to rerun. This drops existing public-table policies and recreates only the
-- public read policies the frontend needs.

alter table public.site_settings enable row level security;
alter table public.videos enable row level security;
alter table public.graphics enable row level security;
alter table public.categories enable row level security;
alter table public.tutorials enable row level security;
alter table public.experiences enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'site_settings',
        'videos',
        'graphics',
        'categories',
        'tutorials',
        'experiences'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

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
using (
  active = true
  and coalesce(visibility_status, true) = true
);

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
