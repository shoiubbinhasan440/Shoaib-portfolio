import {
  validateImageFile,
  type ImageUploadProfile,
} from '@/lib/image-upload-validation';

export async function adminUploadFile(
  bucket: 'graphics' | 'media',
  path: string,
  file: File,
  options: {
    upsert?: boolean;
    uploadProfile?: ImageUploadProfile;
    maxBytes?: number;
    minWidth?: number;
    minHeight?: number;
  } = {}
) {
  const validation = await validateImageFile(file, {
    profile: options.uploadProfile,
    maxBytes: options.maxBytes,
    minWidth: options.minWidth,
    minHeight: options.minHeight,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'Image validation failed.');
  }

  const form = new FormData();
  form.set('bucket', bucket);
  form.set('path', path);
  form.set('file', file);
  form.set('upsert', String(options.upsert ?? true));
  form.set('uploadProfile', options.uploadProfile || 'default');
  if (options.maxBytes) {
    form.set('maxBytes', String(options.maxBytes));
  }

  const response = await fetch('/api/admin/storage-upload', {
    method: 'POST',
    body: form,
  });
  const result = (await response.json()) as {
    error?: string;
    path?: string;
    publicUrl?: string;
  };

  if (!response.ok) {
    throw new Error(result.error || 'Admin upload failed.');
  }

  return {
    path: result.path || path,
    publicUrl: result.publicUrl || '',
  };
}
