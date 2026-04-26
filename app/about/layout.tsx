import type { Metadata } from 'next';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPageMetadata } from '@/lib/site-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerGlobalSettings();
  return buildPageMetadata(settings, 'about');
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
