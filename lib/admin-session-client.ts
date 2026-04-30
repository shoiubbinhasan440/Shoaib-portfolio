export async function verifyAdminSessionClient() {
  try {
    const response = await fetch('/api/admin/session', {
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
