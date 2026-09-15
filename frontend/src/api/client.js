const TOKEN_KEY = 'vorynza_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(message, errors = null, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
    this.status = status;
  }
}

/**
 * Fetch wrapper for ApiResponse { success, message, data, errors }.
 * Attaches JWT from localStorage when present.
 */
export async function apiRequest(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const url = path.startsWith('/api') ? path : `/api${path}`;
  // Never attach JWT on auth endpoints — a stale token can make Spring return 403
  const isAuthEndpoint = url.startsWith('/api/auth/');
  const token = getToken();
  if (token && !isAuthEndpoint) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new ApiError(message, payload?.errors || null, response.status);
  }

  if (payload && typeof payload.success === 'boolean') {
    if (!payload.success) {
      throw new ApiError(payload.message || 'Request failed', payload.errors || null, response.status);
    }
    return payload;
  }

  return { success: true, message: 'OK', data: payload, errors: null };
}

export function apiGet(path) {
  return apiRequest(path, { method: 'GET' });
}

export function apiPost(path, body) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut(path, body) {
  return apiRequest(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path) {
  return apiRequest(path, { method: 'DELETE' });
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
