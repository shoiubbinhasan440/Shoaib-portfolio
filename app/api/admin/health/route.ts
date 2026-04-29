import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

type IssueSeverity = 'critical' | 'warning' | 'info' | 'pass';

type HealthIssue = {
  area: string;
  detail: string;
  fixHint: string;
  id: string;
  severity: IssueSeverity;
  title: string;
};

type CheckResult = {
  detail: string;
  ok: boolean;
};

const ADMIN_TABLES = [
  'site_settings',
  'videos',
  'graphics',
  'categories',
  'tutorials',
  'contact_messages',
  'creative_briefs',
  'client_projects',
  'client_project_updates',
  'client_project_files',
  'message_templates',
  'package_templates',
  'page_views',
];

const STORAGE_BUCKETS = ['media', 'graphics'];

function addIssue(
  issues: HealthIssue[],
  severity: IssueSeverity,
  area: string,
  title: string,
  detail: string,
  fixHint: string
) {
  issues.push({
    area,
    detail,
    fixHint,
    id: `${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`,
    severity,
    title,
  });
}

function envStatus(name: string) {
  return {
    configured: Boolean(process.env[name]),
    name,
  };
}

function siteUrlStatus() {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  return {
    configured: Boolean(value),
    source: process.env.NEXT_PUBLIC_SITE_URL
      ? 'NEXT_PUBLIC_SITE_URL'
      : process.env.SITE_URL
        ? 'SITE_URL'
        : process.env.VERCEL_URL
          ? 'VERCEL_URL'
          : null,
  };
}

async function checkTable(table: string): Promise<CheckResult> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error, count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    if (error) {
      return { ok: false, detail: error.message };
    }

    return {
      ok: true,
      detail: typeof count === 'number' ? `${count} row(s) reachable` : 'Reachable',
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : 'Table check failed',
    };
  }
}

async function checkBucket(bucket: string): Promise<CheckResult> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });

    if (error) {
      return { ok: false, detail: error.message };
    }

    return { ok: true, detail: 'Bucket reachable with server credentials' };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : 'Bucket check failed',
    };
  }
}

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) {
    console.warn('[admin-health] blocked unauthenticated health request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const issues: HealthIssue[] = [];
  const generatedAt = new Date().toISOString();
  const env = {
    adminEmail: envStatus('ADMIN_EMAIL'),
    adminPassword: envStatus('ADMIN_PASSWORD'),
    anonKey: envStatus('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRole: envStatus('SUPABASE_SERVICE_ROLE_KEY'),
    sessionSecret: envStatus('APP_SESSION_SECRET'),
    siteUrl: siteUrlStatus(),
    supabaseUrl: envStatus('NEXT_PUBLIC_SUPABASE_URL'),
  };

  if (!env.adminEmail.configured || !env.adminPassword.configured) {
    addIssue(
      issues,
      'critical',
      'Security',
      'Admin credentials missing',
      'ADMIN_EMAIL or ADMIN_PASSWORD is not configured.',
      'Set strong ADMIN_EMAIL and ADMIN_PASSWORD values in production environment variables.'
    );
  } else {
    addIssue(
      issues,
      'pass',
      'Security',
      'Admin credentials configured',
      'Admin login credentials are present.',
      'Keep credentials private and rotate them if shared.'
    );
  }

  if (!env.sessionSecret.configured) {
    addIssue(
      issues,
      'critical',
      'Security',
      'Session secret missing',
      'APP_SESSION_SECRET is missing, so session signing may fall back to another secret.',
      'Set a long random APP_SESSION_SECRET in production.'
    );
  } else {
    addIssue(
      issues,
      'pass',
      'Security',
      'Session secret configured',
      'APP_SESSION_SECRET is present.',
      'Keep the value server-only and rotate it if compromised.'
    );
  }

  if (!env.serviceRole.configured) {
    addIssue(
      issues,
      'critical',
      'Supabase',
      'Service role key missing',
      'Protected admin writes and uploads need SUPABASE_SERVICE_ROLE_KEY.',
      'Add SUPABASE_SERVICE_ROLE_KEY as a server-only environment variable.'
    );
  } else {
    addIssue(
      issues,
      'pass',
      'Supabase',
      'Server write channel available',
      'SUPABASE_SERVICE_ROLE_KEY is configured for protected server routes.',
      'Keep all admin mutations routed through protected API endpoints.'
    );
  }

  if (!env.siteUrl.configured) {
    addIssue(
      issues,
      'warning',
      'SEO',
      'Canonical site URL missing',
      'No NEXT_PUBLIC_SITE_URL, SITE_URL, or VERCEL_URL value was found.',
      'Set NEXT_PUBLIC_SITE_URL to the production domain for canonical URLs, sitemap, and OG metadata.'
    );
  }

  const [settings, tableResults, bucketResults] = await Promise.all([
    getServerGlobalSettings().catch(error => {
      addIssue(
        issues,
        'warning',
        'Settings',
        'Global settings read failed',
        error instanceof Error ? error.message : 'Unable to read global settings.',
        'Check Supabase read policies and site_settings availability.'
      );
      return null;
    }),
    Promise.all(ADMIN_TABLES.map(async table => [table, await checkTable(table)] as const)),
    Promise.all(STORAGE_BUCKETS.map(async bucket => [bucket, await checkBucket(bucket)] as const)),
  ]);

  const tables = Object.fromEntries(tableResults);
  const buckets = Object.fromEntries(bucketResults);

  tableResults.forEach(([table, result]) => {
    addIssue(
      issues,
      result.ok ? 'pass' : 'warning',
      'Database',
      `${table} ${result.ok ? 'reachable' : 'needs attention'}`,
      result.detail,
      result.ok
        ? 'No action needed for this connectivity check.'
        : `Confirm the ${table} table exists and the service role key can access it.`
    );
  });

  bucketResults.forEach(([bucket, result]) => {
    addIssue(
      issues,
      result.ok ? 'pass' : 'warning',
      'Storage',
      `${bucket} bucket ${result.ok ? 'reachable' : 'needs attention'}`,
      result.detail,
      result.ok
        ? 'No action needed for this storage connectivity check.'
        : `Confirm the ${bucket} bucket exists and admin uploads use /api/admin/storage-upload.`
    );
  });

  if (settings) {
    const seoChecks = [
      {
        ok: Boolean(settings.seo.siteTitle),
        title: 'Meta title configured',
        detail: settings.seo.siteTitle
          ? `Title length: ${settings.seo.siteTitle.length}`
          : 'Global SEO title is empty.',
        fixHint: 'Add a concise site title in Admin Settings > SEO.',
      },
      {
        ok: settings.seo.metaDescription.length >= 70 && settings.seo.metaDescription.length <= 170,
        title: 'Meta description length',
        detail: `Description length: ${settings.seo.metaDescription.length}`,
        fixHint: 'Use a clear 70-170 character description for practical social/search previews.',
      },
      {
        ok: Boolean(settings.seo.defaultOgImage),
        title: 'OG image configured',
        detail: settings.seo.defaultOgImage
          ? 'Default social preview image exists.'
          : 'Default OG image is empty.',
        fixHint: 'Add a default OG image in Admin Settings > SEO.',
      },
      {
        ok: Boolean(settings.seo.canonicalUrl),
        title: 'Canonical URL configured',
        detail: settings.seo.canonicalUrl || 'Canonical URL is empty.',
        fixHint: 'Set the production domain as canonical URL.',
      },
      {
        ok: settings.seo.sitemapEnabled,
        title: 'Sitemap enabled',
        detail: settings.seo.sitemapEnabled ? 'Sitemap generation is enabled.' : 'Sitemap is disabled.',
        fixHint: 'Enable sitemap once the production canonical URL is set.',
      },
      {
        ok: settings.seo.structuredDataEnabled,
        title: 'Structured data enabled',
        detail: settings.seo.structuredDataEnabled
          ? `Structured data type: ${settings.seo.structuredDataType}`
          : 'JSON-LD structured data is disabled.',
        fixHint: 'Enable structured data in Admin Settings > SEO if this is ready for production.',
      },
    ];

    seoChecks.forEach(check => {
      addIssue(
        issues,
        check.ok ? 'pass' : 'warning',
        'SEO',
        check.title,
        check.detail,
        check.fixHint
      );
    });
  }

  addIssue(
    issues,
    'info',
    'RLS',
    'Anon write lock check is manual',
    'This monitor does not perform destructive test writes with the public anon key.',
    'Run the SQL in supabase/production-security.sql and confirm anon INSERT/UPDATE/DELETE are denied for admin tables and buckets.'
  );

  const counts = issues.reduce(
    (summary, issue) => {
      summary[issue.severity] += 1;
      return summary;
    },
    { critical: 0, info: 0, pass: 0, warning: 0 } as Record<IssueSeverity, number>
  );

  return NextResponse.json(
    {
      buckets,
      counts,
      env,
      generatedAt,
      issues,
      routes: {
        adminHealth: '/api/admin/health',
        protectedStorageUpload: '/api/admin/storage-upload',
        protectedSupabaseWrite: '/api/admin/supabase-write',
      },
      tables,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
