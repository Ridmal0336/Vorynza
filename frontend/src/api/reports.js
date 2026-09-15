import { apiGet } from './client';

export function getReportSummary() {
  return apiGet('/api/reports/summary');
}
