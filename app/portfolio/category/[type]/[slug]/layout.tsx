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

function normalizeSourceType(value: string): PortfolioSourceType | null {
  if (value === 'video') {
    return 'video';
  }

  if (value === 'graphic' || value === 'graphics') {
    return 'graphic';
  }

  return null;
}

type CategorySeoDetails = Pick<
  PortfolioCategory,
  | 'name'
  | 'description'
  | 'seo_title'
  | 'seo_description'
  | 'canonical_url'
  | 'og_image_url'
  | 'og_image'
>;

async function getCategorySeoDetails(sourceType: PortfolioSourceType, slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .in('type', [sourceType, 'both'])
    .limit(1);

  const category = ((data || []) as Array<CategorySeoDetails & {
    active?: boolean | null;
    show_on_portfolio?: boolean | null;
    show_on_portfolio_page?: boolean | null;
    visibility_status?: boolean | null;
  }>)[0];

  if (
    !category ||
    (category.visibility_status ?? category.active ?? true) === false ||
    (category.show_on_portfolio_page ?? category.show_on_portfolio ?? true) === false
  ) {
    return null;
  }

  return category;
}

export async function generateMetadata({
  params,
}: CategoryLayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const sourceType = normalizeSourceType(resolvedParams.type) || 'video';
  const slug = decodeURIComponent(resolvedParams.slug || '');
  const [settings, categoryDetails] = await Promise.all([
    getServerGlobalSettings(),
    getCategorySeoDetails(sourceType, slug),
  ]);

  return buildPortfolioCategoryMetadata(settings, {
    categoryTitle: categoryDetails?.name,
    categoryDescription: categoryDetails?.description || undefined,
    seoTitle: categoryDetails?.seo_title || undefined,
    seoDescription: categoryDetails?.seo_description || undefined,
    canonicalUrl: categoryDetails?.canonical_url || undefined,
    ogImage: categoryDetails?.og_image || categoryDetails?.og_image_url || undefined,
    slug,
    sourceType,
  });
}

export default function PortfolioCategoryLayout({ children }: CategoryLayoutProps) {
  return children;
}
