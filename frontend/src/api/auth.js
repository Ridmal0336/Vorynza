import { apiPost } from './client';

export function login(email, password) {
  return apiPost('/api/auth/login', { email, password });
}

export function register(payload) {
  return apiPost('/api/auth/register', payload);
}

export function logout() {
  return apiPost('/api/auth/logout', {});
}
