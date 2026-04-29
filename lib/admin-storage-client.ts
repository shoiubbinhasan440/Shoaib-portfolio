export async function adminUploadFile(
  bucket: 'graphics' | 'media',
  path: string,
  file: File,
  options: { upsert?: boolean } = {}
) {
  const form = new FormData();
  form.set('bucket', bucket);
  form.set('path', path);
  form.set('file', file);
  form.set('upsert', String(options.upsert ?? true));

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
