// Centralized API access. Secrets and MongoDB credentials never belong in React.
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function headersFor(body) {
  const token = localStorage.getItem('campusconnect_token');
  return {
    ...((body !== undefined && !(body instanceof FormData)) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: headersFor(body),
      ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Cannot connect to the server. Check that the backend is running.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
async function getBlob(path) {
  const response = await fetch(`${BASE_URL}${path}`, { headers: headersFor() });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Could not retrieve image');
  }
  return response.blob();
}
export const api = {
  get: path => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData }),
  getBlob,
};
