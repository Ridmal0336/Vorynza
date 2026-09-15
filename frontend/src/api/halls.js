import { apiDelete, apiGet, apiPost, apiPut, buildQuery } from './client';

export function getHalls(filters = {}) {
  return apiGet(`/api/halls${buildQuery(filters)}`);
}

export function getHall(id) {
  return apiGet(`/api/halls/${id}`);
}

export function checkHallAvailability(id, date) {
  return apiGet(`/api/halls/${id}/availability${buildQuery({ date })}`);
}

export function createHall(payload) {
  return apiPost('/api/halls', payload);
}

export function updateHall(id, payload) {
  return apiPut(`/api/halls/${id}`, payload);
}

export function deleteHall(id) {
  return apiDelete(`/api/halls/${id}`);
}
