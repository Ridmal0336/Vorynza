const TONE_BY_STATUS = {
  PENDING: 'pending',
  UNPAID: 'pending',
  PARTIAL: 'pending',
  CONFIRMED: 'confirmed',
  PAID: 'confirmed',
  COMPLETED: 'confirmed',
  ACTIVE: 'confirmed',
  CANCELLED: 'cancelled',
  VOID: 'muted',
  INACTIVE: 'muted',
};

export default function StatusBadge({ status, children }) {
  const key = String(status || '').toUpperCase();
  const tone = TONE_BY_STATUS[key] || 'neutral';
  const label = children || (key ? key.charAt(0) + key.slice(1).toLowerCase() : '—');

  return <span className={`badge badge--${tone}`}>{label}</span>;
}
