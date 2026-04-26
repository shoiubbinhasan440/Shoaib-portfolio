import type { MetadataRoute } from 'next';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildRobots } from '@/lib/site-metadata';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getServerGlobalSettings();
  return buildRobots(settings);
}
