import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  return NextResponse.json(
    { authenticated: true },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
