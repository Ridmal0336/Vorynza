import { apiDelete, apiGet, apiPost, apiPut } from './client';

export function getReservations() {
  return apiGet('/api/reservations');
}

export function getReservation(id) {
  return apiGet(`/api/reservations/${id}`);
}

export function getReservationConfirmation(id) {
  return apiGet(`/api/reservations/${id}/confirmation`);
}

export function createReservation(payload) {
  return apiPost('/api/reservations', payload);
}

export function updateReservation(id, payload) {
  return apiPut(`/api/reservations/${id}`, payload);
}

export function cancelReservation(id) {
  return apiDelete(`/api/reservations/${id}`);
}

export function updateReservationStatus(id, status) {
  return apiPut(`/api/reservations/${id}/status`, { status });
}
