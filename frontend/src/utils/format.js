const currencyFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

const currencyExactFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '—';
  return currencyFormatter.format(num);
}

export function formatCurrencyExact(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '—';
  return currencyExactFormatter.format(num);
}

export function formatNumber(value) {
  const num = Number(value ?? 0);
  return Number.isNaN(num) ? '—' : num.toLocaleString('en-LK');
}

/** Renders an ISO date (yyyy-mm-dd) without timezone drift. */
export function formatDate(value) {
  if (!value) return '—';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return String(value);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

/** Splits a stored inclusions/facilities blob on commas, semicolons, pipes, or newlines. */
export function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(/[\n;|,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function titleCase(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function isUpcoming(isoDate) {
  if (!isoDate) return false;
  return String(isoDate).slice(0, 10) >= new Date().toISOString().slice(0, 10);
}
