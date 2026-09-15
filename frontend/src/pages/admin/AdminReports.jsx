import { useEffect, useState } from 'react';
import { ErrorState, LoadingText } from '../../components/States';
import * as reportsApi from '../../api/reports';
import { formatCurrencyExact, formatNumber } from '../../utils/format';
import { AdminHeader } from './adminShared';

export default function AdminReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportsApi.getReportSummary();
      setSummary(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load the report summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingText>Loading report summary…</LoadingText>;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!summary) return <ErrorState message="No report data available" onRetry={load} />;

  const reservationStats = [
    { label: 'Total reservations', value: formatNumber(summary.totalReservations) },
    { label: 'Pending', value: formatNumber(summary.pendingReservations) },
    { label: 'Confirmed', value: formatNumber(summary.confirmedReservations) },
    { label: 'Cancelled', value: formatNumber(summary.cancelledReservations) },
  ];

  const billingStats = [
    { label: 'Total invoices', value: formatNumber(summary.totalInvoices) },
    { label: 'Paid invoices', value: formatNumber(summary.paidInvoices) },
    { label: 'Unpaid invoices', value: formatNumber(summary.unpaidInvoices) },
    { label: 'Total billed', value: formatCurrencyExact(summary.totalBilled) },
    { label: 'Total collected', value: formatCurrencyExact(summary.totalCollected) },
    { label: 'Outstanding', value: formatCurrencyExact(summary.outstanding) },
  ];

  const collectionRate =
    Number(summary.totalBilled) > 0
      ? (Number(summary.totalCollected) / Number(summary.totalBilled)) * 100
      : 0;

  return (
    <div>
      <AdminHeader
        title="Reports"
        description="Reservation pipeline and billing performance across the platform."
      />

      <h2 style={{ marginBottom: 20 }}>Reservations</h2>
      <div className="stats-grid">
        {reservationStats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{stat.value}</span>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 20 }}>Billing</h2>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {billingStats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value" style={{ fontSize: 26 }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="panel panel--alt">
        <p className="label-text">Collection rate</p>
        <p
          className="price"
          style={{ fontSize: 40, lineHeight: 1.1, margin: '8px 0 6px' }}
        >
          {collectionRate.toFixed(1)}%
        </p>
        <p className="muted" style={{ fontSize: 14 }}>
          {formatCurrencyExact(summary.totalCollected)} collected of{' '}
          {formatCurrencyExact(summary.totalBilled)} billed.
        </p>
      </div>
    </div>
  );
}
