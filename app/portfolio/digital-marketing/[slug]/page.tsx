import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import PortfolioDetailView from '@/components/portfolio/PortfolioDetailView';
import { getPortfolioDetailData } from '@/lib/portfolio-detail';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPageMetadata, buildPortfolioItemMetadata } from '@/lib/site-metadata';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const settings = await getServerGlobalSettings();
  const data = await getPortfolioDetailData('digital-marketing', slug);

  if (!data) {
    return buildPageMetadata(settings, 'portfolio');
  }

  return buildPortfolioItemMetadata(settings, {
    item: data.item,
    meta: data.meta,
  });
}

export default async function DigitalMarketingPortfolioDetailPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const data = await getPortfolioDetailData('digital-marketing', slug);

  if (!data) {
    notFound();
  }

  return <PortfolioDetailView {...data} />;
}
