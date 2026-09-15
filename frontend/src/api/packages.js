import { apiDelete, apiGet, apiPost, apiPut, buildQuery } from './client';

export function getPackages(filters = {}) {
  return apiGet(`/api/packages${buildQuery(filters)}`);
}

export function getPackage(id) {
  return apiGet(`/api/packages/${id}`);
}

export function createPackage(payload) {
  return apiPost('/api/packages', payload);
}

export function updatePackage(id, payload) {
  return apiPut(`/api/packages/${id}`, payload);
}

export function deletePackage(id) {
  return apiDelete(`/api/packages/${id}`);
}
