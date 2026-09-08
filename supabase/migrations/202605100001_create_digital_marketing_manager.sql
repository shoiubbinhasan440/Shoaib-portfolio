-- Digital marketing portfolio manager schema.
-- Safe to rerun. Adds a separate content table so existing videos/graphics stay untouched.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'categories'
      and constraint_name = 'categories_type_check'
  ) then
    alter table public.categories drop constraint categories_type_check;
  end if;
end $$;

alter table public.categories
  add constraint categories_type_check
  check (type in ('video', 'graphic', 'marketing', 'both', 'all'));

create table if not exists public.digital_marketing (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text,
  category text not null default '',
  image_url text not null default '',
  description text,
  visible boolean not null default true,
  order_num integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_digital_marketing_updated_at on public.digital_marketing;
create trigger set_digital_marketing_updated_at
before update on public.digital_marketing
for each row execute function public.set_updated_at();

create index if not exists digital_marketing_visible_order_idx
  on public.digital_marketing (visible, order_num, created_at desc);

create index if not exists digital_marketing_slug_idx
  on public.digital_marketing (slug);

alter table public.digital_marketing enable row level security;

drop policy if exists "Public read visible digital marketing" on public.digital_marketing;
create policy "Public read visible digital marketing"
on public.digital_marketing
for select
to anon, authenticated
using (visible = true);

notify pgrst, 'reload schema';
