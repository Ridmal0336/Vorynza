import { apiDelete, apiGet, apiPost, apiPut } from './client';

export function getHotels() {
  return apiGet('/api/hotels');
}

export function getHotel(id) {
  return apiGet(`/api/hotels/${id}`);
}

export function createHotel(payload) {
  return apiPost('/api/hotels', payload);
}

export function updateHotel(id, payload) {
  return apiPut(`/api/hotels/${id}`, payload);
}

export function deleteHotel(id) {
  return apiDelete(`/api/hotels/${id}`);
}
