type AdminWriteAction = 'delete' | 'insert' | 'update' | 'upsert';

type AdminWriteInput = {
  action: AdminWriteAction;
  filters?: Record<string, unknown>;
  onConflict?: string;
  payload?: unknown;
  select?: string;
  table: string;
};

export async function adminSupabaseWrite<T = unknown>(input: AdminWriteInput) {
  const response = await fetch('/api/admin/supabase-write', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as { data?: T; error?: string };

  if (!response.ok) {
    throw new Error(result.error || 'Admin write failed.');
  }

  return result.data as T;
}

export function adminInsertRows<T = unknown>(
  table: string,
  payload: unknown,
  select?: string
) {
  return adminSupabaseWrite<T>({ action: 'insert', payload, select, table });
}

export function adminUpdateRows<T = unknown>(
  table: string,
  payload: unknown,
  filters: Record<string, unknown>,
  select?: string
) {
  return adminSupabaseWrite<T>({ action: 'update', filters, payload, select, table });
}

export function adminUpsertRows<T = unknown>(
  table: string,
  payload: unknown,
  onConflict?: string,
  select?: string
) {
  return adminSupabaseWrite<T>({
    action: 'upsert',
    onConflict,
    payload,
    select,
    table,
  });
}

export function adminDeleteRows(table: string, filters: Record<string, unknown>) {
  return adminSupabaseWrite<null>({ action: 'delete', filters, table });
}
