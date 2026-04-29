import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPortfolioCategoryMetadata } from '@/lib/site-metadata';
import type { PortfolioCategory, PortfolioSourceType } from '@/lib/portfolio-content';

type CategoryLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
    type: string;
  }>;
};

function isPortfolioSourceType(value: string): value is PortfolioSourceType {
  return value === 'video' || value === 'graphic';
}

async function getCategoryTitle(sourceType: PortfolioSourceType, slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return '';
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await supabase
    .from('categories')
    .select('name, slug, type')
    .eq('slug', slug)
    .in('type', [sourceType, 'both'])
    .limit(1);

  return ((data || []) as Array<Pick<PortfolioCategory, 'name'>>)[0]?.name || '';
}

export async function generateMetadata({
  params,
}: CategoryLayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const sourceType = isPortfolioSourceType(resolvedParams.type)
    ? resolvedParams.type
    : 'video';
  const slug = decodeURIComponent(resolvedParams.slug || '');
  const [settings, categoryTitle] = await Promise.all([
    getServerGlobalSettings(),
    getCategoryTitle(sourceType, slug),
  ]);

  return buildPortfolioCategoryMetadata(settings, {
    categoryTitle,
    slug,
    sourceType,
  });
}

export default function PortfolioCategoryLayout({ children }: CategoryLayoutProps) {
  return children;
}
