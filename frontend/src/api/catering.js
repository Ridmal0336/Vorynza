import { apiDelete, apiGet, apiPost, apiPut, buildQuery } from './client';

export function getCateringPackages(filters = {}) {
  return apiGet(`/api/catering-packages${buildQuery(filters)}`);
}

export function getCateringPackage(id) {
  return apiGet(`/api/catering-packages/${id}`);
}

export function createCateringPackage(payload) {
  return apiPost('/api/catering-packages', payload);
}

export function updateCateringPackage(id, payload) {
  return apiPut(`/api/catering-packages/${id}`, payload);
}

export function deleteCateringPackage(id) {
  return apiDelete(`/api/catering-packages/${id}`);
}

export function getMenuItems(filters = {}) {
  return apiGet(`/api/menu-items${buildQuery(filters)}`);
}

export function getMenuItem(id) {
  return apiGet(`/api/menu-items/${id}`);
}

export function createMenuItem(payload) {
  return apiPost('/api/menu-items', payload);
}

export function updateMenuItem(id, payload) {
  return apiPut(`/api/menu-items/${id}`, payload);
}

export function deleteMenuItem(id) {
  return apiDelete(`/api/menu-items/${id}`);
}

export function estimateCost(payload) {
  return apiPost('/api/menu-items/estimate', payload);
}
