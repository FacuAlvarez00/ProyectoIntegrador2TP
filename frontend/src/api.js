const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function api(path, { method='GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let message = 'Error';
    try { const data = await res.json(); message = data.message || message; } catch {}
    throw new Error(message);
  }
  return res.json();
}
