import type { Metadata } from 'next';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPageMetadata } from '@/lib/site-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerGlobalSettings();
  return buildPageMetadata(settings, 'contact');
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
