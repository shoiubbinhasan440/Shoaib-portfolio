import type { MetadataRoute } from 'next';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildSitemap } from '@/lib/site-metadata';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getServerGlobalSettings();
  return buildSitemap(settings);
}
