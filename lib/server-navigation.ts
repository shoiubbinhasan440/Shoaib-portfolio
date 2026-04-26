import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  createDefaultNavigationConfig,
  NAVIGATION_SETTINGS_KEY,
  parseNavigationConfig,
  type LegacyNavigationItem,
} from '@/lib/navigation-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const getServerNavigationConfig = cache(async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createDefaultNavigationConfig();
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: settingsRows }, { data: legacyRows }] = await Promise.all([
      supabase.from('site_settings').select('key, value').eq('key', NAVIGATION_SETTINGS_KEY),
      supabase
        .from('navigation')
        .select('id, label, href, order_num, visible')
        .order('order_num', { ascending: true }),
    ]);

    const rawValue =
      settingsRows && settingsRows.length > 0 && typeof settingsRows[0]?.value === 'string'
        ? settingsRows[0].value
        : undefined;

    return parseNavigationConfig(rawValue, {
      legacyItems: (legacyRows || []) as LegacyNavigationItem[],
    });
  } catch {
    return createDefaultNavigationConfig();
  }
});

