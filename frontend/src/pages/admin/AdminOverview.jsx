import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, LoadingText } from '../../components/States';
import * as reportsApi from '../../api/reports';
import * as reservationsApi from '../../api/reservations';
import * as invoicesApi from '../../api/invoices';
import * as hotelsApi from '../../api/hotels';
import { formatCurrency, formatDate, formatNumber, isUpcoming } from '../../utils/format';
import { AdminHeader } from './adminShared';

export default function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, resRes, invRes, hotelRes] = await Promise.all([
        reportsApi.getReportSummary().catch(() => null),
        reservationsApi.getReservations().catch(() => ({ data: [] })),
        invoicesApi.getInvoices().catch(() => ({ data: [] })),
        hotelsApi.getHotels().catch(() => ({ data: [] })),
      ]);
      setSummary(summaryRes?.data || null);
      setReservations(resRes.data || []);
      setInvoices(invRes.data || []);
      setHotels(hotelRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // The summary endpoint has no per-month figure, so revenue for the month is
    // derived from invoice payments recorded this month.
    const revenueThisMonth = invoices
      .filter((inv) => String(inv.paidAt || '').startsWith(monthPrefix))
      .reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

    const upcomingWeddings = reservations.filter(
      (r) => isUpcoming(r.eventDate) && r.status !== 'CANCELLED'
    ).length;

    return [
      {
        label: 'Total bookings',
        value: formatNumber(summary?.totalReservations ?? reservations.length),
        hint: `${summary?.pendingReservations ?? 0} pending · ${
          summary?.confirmedReservations ?? 0
        } confirmed`,
      },
      {
        label: 'Revenue (month)',
        value: formatCurrency(revenueThisMonth),
        hint: `${formatCurrency(summary?.totalCollected ?? 0)} collected all-time`,
      },
      {
        label: 'Upcoming weddings',
        value: formatNumber(upcomingWeddings),
        hint: 'Active reservations from today',
      },
      {
        label: 'Active hotels',
        value: formatNumber(hotels.length),
        hint: `${formatCurrency(summary?.outstanding ?? 0)} outstanding`,
      },
    ];
  }, [summary, reservations, invoices, hotels]);

  const nextWeddings = useMemo(
    () =>
      reservations
        .filter((r) => isUpcoming(r.eventDate) && r.status !== 'CANCELLED')
        .sort((a, b) => String(a.eventDate).localeCompare(String(b.eventDate)))
        .slice(0, 6),
    [reservations]
  );

  if (loading) return <LoadingText>Loading dashboard…</LoadingText>;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <AdminHeader
        title="Overview"
        description="Bookings, revenue, and the weddings coming up across every hotel."
      />

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{stat.value}</span>
            <span className="stat__hint">{stat.hint}</span>
          </div>
        ))}
      </div>

      <div className="table-toolbar">
        <h2>Next weddings</h2>
        <Link to="/admin/reservations" className="btn btn--quiet btn--sm">
          All reservations
        </Link>
      </div>

      {nextWeddings.length === 0 ? (
        <div className="state">
          <h3>No upcoming weddings</h3>
          <p>New reservations will appear here as customers book.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Hall</th>
                <th>Package</th>
                <th>Guests</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {nextWeddings.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.eventDate)}</td>
                  <td>{r.customerName}</td>
                  <td>{r.hallName}</td>
                  <td>{r.packageName}</td>
                  <td>{formatNumber(r.guestCount)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
