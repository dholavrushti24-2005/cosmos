/* ==========================================================================
   COSMOS — ADMIN SIDE API WRAPPER
   Thin fetch helper. Attaches JWT admin token from localStorage automatically.
   ========================================================================== */

const API_BASE = '/api';

async function adminApiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('cosmos_admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const message = (data && data.message) || 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}

const adminApi = {
  get: (path, opts) => adminApiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => adminApiRequest(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => adminApiRequest(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => adminApiRequest(path, { ...opts, method: 'DELETE' }),
};
