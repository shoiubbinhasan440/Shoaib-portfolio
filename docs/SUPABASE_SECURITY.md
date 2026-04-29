# Supabase Production Security

This app should not allow browser users with the public anon key to write admin content.
Admin mutations now go through protected Next.js routes that validate the signed admin
session cookie and use `SUPABASE_SERVICE_ROLE_KEY` on the server.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `APP_SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL` or `SITE_URL` for canonical URLs and sitemap output

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, or `APP_SESSION_SECRET`
with a `NEXT_PUBLIC_` prefix.

## Protected Write Routes

- `POST /api/admin/supabase-write`
  - Used for admin table writes to `site_settings`, `videos`, `graphics`,
    `categories`, and `tutorials`.
  - Requires a valid admin session cookie.

- `POST /api/admin/storage-upload`
  - Used for admin uploads to `media` and `graphics`.
  - Covers hero images, homepage assets, portfolio banners, video thumbnails,
    graphics uploads, SEO/social images, navigation logos, footer logos, contact
    images, and tutorial thumbnails.
  - Requires a valid admin session cookie.

- Existing protected server routes continue handling CRM/admin data:
  - `/api/contact` for public contact submit plus admin lead operations
  - `/api/admin/projects`
  - `/api/admin/briefs`
  - `/api/admin/templates`
  - `/api/admin/whatsapp`

## Tables To Lock With RLS

Enable RLS and do not create anon write policies for:

- `site_settings`
- `videos`
- `graphics`
- `categories`
- `tutorials`
- `contact_leads` / inbox/leads/messages tables if present
- `projects` / project milestone/update tables if present
- `page_views` if present

Public read policies should allow only published content:

- `videos.visible = true`
- `graphics.visible = true`
- `tutorials.visible = true`
- `categories.active = true`
- `site_settings` should be read-only and must not contain secrets

## Buckets To Lock

Storage buckets used by admin uploads:

- `media`
- `graphics`

Keep public read enabled if the assets are used on the public website, but do not
create anon/authenticated insert/update/delete policies. Uploads should go through
`/api/admin/storage-upload`.

## SQL

Apply and review:

```sql
-- See supabase/production-security.sql
```

Before applying to production, confirm any custom table names in your Supabase
project. The app stores most CRM data in JSON `site_settings` keys through
server-side helpers, so direct public writes to `site_settings` must be denied.

## Manual Supabase Dashboard Steps

1. Open Supabase Dashboard -> Authentication/Policies.
2. Enable RLS on the listed tables.
3. Apply `supabase/production-security.sql`.
4. Open Storage -> Policies.
5. Confirm `media` and `graphics` allow public `select` only.
6. Remove any anon/authenticated `insert`, `update`, or `delete` storage policies.
7. Re-test admin login, save, and upload flows.
