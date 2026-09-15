import { apiDelete, apiGet, apiPost, apiPut } from './client';

export function getInvoices() {
  return apiGet('/api/invoices');
}

export function getInvoice(id) {
  return apiGet(`/api/invoices/${id}`);
}

export function getInvoicesByCustomer(customerId) {
  return apiGet(`/api/invoices/customer/${customerId}`);
}

export function getPrintableInvoice(id) {
  return apiGet(`/api/invoices/${id}/print`);
}

export function createInvoice(payload) {
  return apiPost('/api/invoices', payload);
}

export function updatePayment(id, payload) {
  return apiPut(`/api/invoices/${id}/payment`, payload);
}

export function voidInvoice(id) {
  return apiDelete(`/api/invoices/${id}`);
}
