import type {
  PortfolioCategory,
  PortfolioGraphic,
  PortfolioVideo,
} from '@/lib/portfolio-content';

type AdminWriteAction = 'delete' | 'insert' | 'update' | 'upsert';

type AdminReadOrder = {
  ascending?: boolean;
  column: string;
};

type AdminReadInput = {
  count?: 'exact' | 'planned' | 'estimated';
  filters?: Record<string, unknown>;
  head?: boolean;
  limit?: number;
  order?: AdminReadOrder[];
  select?: string;
  table: string;
};

type AdminWriteInput = {
  action: AdminWriteAction;
  filters?: Record<string, unknown>;
  onConflict?: string;
  payload?: unknown;
  select?: string;
  table: string;
};

type AdminReadResult<T> = {
  count?: number | null;
  data?: T;
  error?: string;
};

export async function adminSupabaseRead<T = unknown>(input: AdminReadInput) {
  const response = await fetch('/api/admin/supabase-read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as AdminReadResult<T>;

  if (!response.ok) {
    throw new Error(result.error || 'Admin read failed.');
  }

  return result;
}

export async function adminSelectRows<T = unknown>(
  table: string,
  options: Omit<AdminReadInput, 'table'> = {}
) {
  const result = await adminSupabaseRead<T>({ ...options, table });
  return result.data as T;
}

export async function adminCountRows(
  table: string,
  options: Omit<AdminReadInput, 'count' | 'head' | 'select' | 'table'> = {}
) {
  const result = await adminSupabaseRead<null>({
    ...options,
    count: 'exact',
    head: true,
    select: 'id',
    table,
  });
  return result.count ?? 0;
}

export async function adminFetchPortfolioDataset() {
  const [videos, graphicsRows, categories] = await Promise.all([
    adminSelectRows<PortfolioVideo[]>('videos', {
      order: [{ column: 'order_num', ascending: true }],
    }),
    adminSelectRows<PortfolioGraphic[]>('graphics', {
      order: [
        { column: 'order_num', ascending: true },
        { column: 'created_at', ascending: false },
      ],
    }),
    adminSelectRows<PortfolioCategory[]>('categories', {
      order: [{ column: 'order_num', ascending: true }],
    }),
  ]);

  const graphics = (graphicsRows || []).map((graphic, index) => ({
    ...graphic,
    order_num:
      typeof graphic.order_num === 'number' && Number.isFinite(graphic.order_num)
        ? graphic.order_num
        : 1000 + index,
  }));

  return {
    categories: categories || [],
    graphics,
    videos: videos || [],
  };
}

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

export function getMissingSchemaColumn(table: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (
    message.match(new RegExp(`'([^']+)' column of '${escapedTable}'`))?.[1] ||
    message.match(new RegExp(`column "([^"]+)" of relation "${escapedTable}"`))?.[1] ||
    ''
  );
}

function removeColumnFromPayload(payload: unknown, column: string): unknown {
  if (Array.isArray(payload)) {
    return payload.map(item => removeColumnFromPayload(item, column));
  }

  if (payload && typeof payload === 'object') {
    const nextPayload = { ...(payload as Record<string, unknown>) };
    delete nextPayload[column];
    return nextPayload;
  }

  return payload;
}

export async function adminInsertRowsWithSchemaFallback<T = unknown>(
  table: string,
  payload: unknown,
  select?: string
) {
  let nextPayload = payload;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await adminInsertRows<T>(table, nextPayload, select);
    } catch (error) {
      const missingColumn = getMissingSchemaColumn(table, error);
      if (!missingColumn) {
        throw error;
      }
      nextPayload = removeColumnFromPayload(nextPayload, missingColumn);
    }
  }

  throw new Error(`Admin insert failed after removing unsupported ${table} columns.`);
}

export async function adminUpdateRowsWithSchemaFallback<T = unknown>(
  table: string,
  payload: unknown,
  filters: Record<string, unknown>,
  select?: string
) {
  let nextPayload = payload;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await adminUpdateRows<T>(table, nextPayload, filters, select);
    } catch (error) {
      const missingColumn = getMissingSchemaColumn(table, error);
      if (!missingColumn) {
        throw error;
      }
      nextPayload = removeColumnFromPayload(nextPayload, missingColumn);
    }
  }

  throw new Error(`Admin update failed after removing unsupported ${table} columns.`);
}
