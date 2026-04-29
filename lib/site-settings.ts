import type { SupabaseClient } from '@supabase/supabase-js';
import { adminUpsertRows } from '@/lib/admin-data-client';

export async function writeSiteSetting(
  supabase: SupabaseClient,
  key: string,
  value: string
) {
  if (typeof window !== 'undefined') {
    await adminUpsertRows('site_settings', { key, value }, 'key');
    return;
  }

  const { data: existingRows, error: selectError } = await supabase
    .from('site_settings')
    .select('id')
    .eq('key', key);

  if (selectError) {
    throw selectError;
  }

  if ((existingRows || []).length > 0) {
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ value })
      .eq('key', key);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await supabase
    .from('site_settings')
    .insert({ key, value });

  if (insertError) {
    throw insertError;
  }
}
