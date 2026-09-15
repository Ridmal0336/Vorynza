import { apiDelete, apiGet, apiPut } from './client';

export function getUsers() {
  return apiGet('/api/users');
}

export function getMe() {
  return apiGet('/api/users/me');
}

export function getUser(id) {
  return apiGet(`/api/users/${id}`);
}

export function updateUser(id, payload) {
  return apiPut(`/api/users/${id}`, payload);
}

export function deactivateUser(id) {
  return apiDelete(`/api/users/${id}`);
}

export function changePassword(payload) {
  return apiPut('/api/users/me/password', payload);
}
