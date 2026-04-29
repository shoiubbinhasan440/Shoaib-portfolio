export async function verifyAdminSessionClient() {
  try {
    const response = await fetch('/api/admin/session', {
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      localStorage.removeItem('admin_token');
      return false;
    }

    localStorage.setItem('admin_token', 'active');
    return true;
  } catch {
    localStorage.removeItem('admin_token');
    return false;
  }
}
