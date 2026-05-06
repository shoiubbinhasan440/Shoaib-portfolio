-- Professional experience records for homepage/about display.
-- Admin writes should go through the protected Next.js admin API using the
-- Supabase service role. Public clients can only read visible rows.

create table if not exists public.experiences (
  id text primary key,
  organization_name text not null default '',
  role_title text not null default '',
  employment_type text not null default 'Full-time'
    check (employment_type in ('Full-time', 'Part-time', 'Contract', 'Freelance', 'Volunteer', 'Internship')),
  start_date date,
  end_date date,
  is_current boolean not null default false,
  location text not null default '',
  location_type text not null default 'On-site'
    check (location_type in ('On-site', 'Hybrid', 'Remote')),
  description text not null default '',
  achievements jsonb not null default '[]'::jsonb,
  logo_url text not null default '',
  website_url text not null default '',
  skills jsonb not null default '[]'::jsonb,
  show_homepage boolean not null default true,
  show_about_page boolean not null default true,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experiences_visible_order_idx
on public.experiences (is_visible, sort_order, start_date desc);

create or replace function public.set_experiences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_experiences_updated_at on public.experiences;

create trigger set_experiences_updated_at
before update on public.experiences
for each row
execute function public.set_experiences_updated_at();

alter table public.experiences enable row level security;

drop policy if exists "Public read visible experiences" on public.experiences;

create policy "Public read visible experiences"
on public.experiences
for select
to anon, authenticated
using (is_visible = true);
