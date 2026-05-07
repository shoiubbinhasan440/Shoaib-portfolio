import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioDetailView from '@/components/portfolio/PortfolioDetailView';
import { getPortfolioDetailData } from '@/lib/portfolio-detail';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPageMetadata, buildPortfolioItemMetadata } from '@/lib/site-metadata';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerGlobalSettings();
  const data = await getPortfolioDetailData('graphics', slug);

  if (!data) {
    return buildPageMetadata(settings, 'portfolio');
  }

  return buildPortfolioItemMetadata(settings, {
    item: data.item,
    meta: data.meta,
  });
}

export default async function GraphicPortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPortfolioDetailData('graphics', slug);

  if (!data) {
    notFound();
  }

  return <PortfolioDetailView {...data} />;
}
