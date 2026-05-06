import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_TOO_LARGE_MESSAGE,
  IMAGE_TYPE_ERROR_MESSAGE,
  getImageUploadMaxBytes,
  hasValidImageSignature,
  type ImageUploadProfile,
} from '@/lib/image-upload-validation';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

const ALLOWED_BUCKETS = new Set(['graphics', 'media']);
const ALLOWED_EXTENSIONS = new Set(ALLOWED_IMAGE_EXTENSIONS);
const ALLOWED_MIME_TYPES = new Set(ALLOWED_IMAGE_MIME_TYPES);
const UPLOAD_PROFILES = new Set(['default', 'hero', 'thumbnail', 'showcase', 'logo']);

function safePath(value: string) {
  return (
    value &&
    !value.startsWith('/') &&
    !value.includes('..') &&
    /^[a-zA-Z0-9/_.,-]+$/.test(value)
  );
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const form = await request.formData();
  const bucket = String(form.get('bucket') || '');
  const path = String(form.get('path') || '');
  const file = form.get('file');
  const upsert = String(form.get('upsert') || 'true') === 'true';
  const uploadProfileValue = String(form.get('uploadProfile') || 'default');
  const uploadProfile: ImageUploadProfile = UPLOAD_PROFILES.has(uploadProfileValue)
    ? (uploadProfileValue as ImageUploadProfile)
    : 'default';
  const requestedMaxBytes = Number(form.get('maxBytes') || 0);
  const profileMaxBytes = getImageUploadMaxBytes(uploadProfile);
  const maxBytes =
    Number.isFinite(requestedMaxBytes) && requestedMaxBytes > 0
      ? Math.min(requestedMaxBytes, profileMaxBytes)
      : profileMaxBytes;

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Storage bucket is not allowed.' }, { status: 400 });
  }

  if (!safePath(path)) {
    return NextResponse.json({ error: 'Storage path is invalid.' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Upload file is missing.' }, { status: 400 });
  }

  if (file.size > maxBytes) {
    console.warn('[upload-blocked]', { bucket, path, reason: 'size', size: file.size });
    return NextResponse.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 400 });
  }

  const extension = path.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.type)) {
    console.warn('[upload-blocked]', {
      bucket,
      path,
      reason: 'type',
      type: file.type,
    });
    return NextResponse.json({ error: IMAGE_TYPE_ERROR_MESSAGE }, { status: 400 });
  }

  if (!(await hasValidImageSignature(file))) {
    console.warn('[upload-blocked]', {
      bucket,
      path,
      reason: 'signature',
      type: file.type,
    });
    return NextResponse.json({ error: IMAGE_TYPE_ERROR_MESSAGE }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert,
  });

  if (error) {
    console.error('[upload-error]', { bucket, message: error.message, path });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json(
    { path, publicUrl: data.publicUrl },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
