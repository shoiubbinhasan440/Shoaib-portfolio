import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPageMetadata } from '@/lib/site-metadata';

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getServerGlobalSettings();
  return buildPageMetadata(settings, 'graphics');
}

export default function GraphicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
