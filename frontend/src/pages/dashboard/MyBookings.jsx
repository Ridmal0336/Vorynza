import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FormError from '../../components/FormError';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as reservationsApi from '../../api/reservations';
import * as invoicesApi from '../../api/invoices';
import * as hallsApi from '../../api/halls';
import { formatCurrency, formatDate, formatNumber, isUpcoming } from '../../utils/format';
import { coverFor } from '../../utils/images';

export default function MyBookings() {
  const [reservations, setReservations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [hallsById, setHallsById] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [detail, setDetail] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [resRes, invRes, hallRes] = await Promise.all([
        reservationsApi.getReservations(),
        invoicesApi.getInvoices().catch(() => ({ data: [] })),
        hallsApi.getHalls().catch(() => ({ data: [] })),
      ]);
      setReservations(resRes.data || []);
      setInvoices(invRes.data || []);
      const map = new Map();
      (hallRes.data || []).forEach((hall) => map.set(hall.id, hall));
      setHallsById(map);
    } catch (err) {
      setError(err.message || 'Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const invoiceByReservation = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => map.set(inv.reservationId, inv));
    return map;
  }, [invoices]);

  const sorted = useMemo(
    () =>
      [...reservations].sort((a, b) => String(b.eventDate).localeCompare(String(a.eventDate))),
    [reservations]
  );

  const upcoming = sorted.filter((r) => isUpcoming(r.eventDate) && r.status !== 'CANCELLED');

  const viewConfirmation = async (reservation) => {
    setMessage('');
    setBusyId(reservation.id);
    try {
      const res = await reservationsApi.getReservationConfirmation(reservation.id);
      setDetail({ ...reservation, ...res.data });
    } catch (err) {
      setMessage(err.message || 'Could not load the confirmation');
    } finally {
      setBusyId(null);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    setMessage('');
    setBusyId(invoiceId);
    try {
      const res = await invoicesApi.getPrintableInvoice(invoiceId);
      const data = res.data || {};
      const text = data.printText || JSON.stringify(data, null, 2);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.invoiceNumber || `vorynza-invoice-${invoiceId}`}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.message || 'Could not download the invoice');
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this reservation? This cannot be undone.')) return;
    setMessage('');
    setSuccess('');
    setBusyId(id);
    try {
      await reservationsApi.cancelReservation(id);
      setSuccess('Reservation cancelled.');
      await load();
    } catch (err) {
      setMessage(err.message || 'Could not cancel this reservation');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-head__text">
          <p className="eyebrow">Dashboard</p>
          <h1>My bookings</h1>
          <p className="lead">
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming ${
                  upcoming.length === 1 ? 'celebration' : 'celebrations'
                }.`
              : 'Every reservation you make appears here.'}
          </p>
        </div>
        <Link to="/book" className="btn btn--primary btn--sm">
          New booking
        </Link>
      </div>

      {success && <div className="success-banner">{success}</div>}
      {message && <FormError message={message} />}

      {loading ? (
        <LoadingText>Loading your bookings…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Once you reserve a hall, you'll be able to track its status, invoice, and details here."
          actionLabel="Find a venue"
          actionTo="/halls"
        />
      ) : (
        <div className="stack">
          {sorted.map((reservation) => {
            const hall = hallsById.get(reservation.hallId);
            const invoice = invoiceByReservation.get(reservation.id);
            const canCancel = reservation.status !== 'CANCELLED' && isUpcoming(reservation.eventDate);

            return (
              <article className="booking-row" key={reservation.id}>
                <div className="booking-row__media">
                  <img
                    src={coverFor(hall || { id: reservation.hallId }, 500)}
                    alt={reservation.hallName}
                    loading="lazy"
                  />
                </div>

                <div className="booking-row__info">
                  <span className="booking-row__title">{reservation.hallName}</span>
                  <span className="booking-row__meta">
                    {formatDate(reservation.eventDate)} ·{' '}
                    {formatNumber(reservation.guestCount)} guests · {reservation.packageName}
                  </span>
                  <div className="row" style={{ gap: 8 }}>
                    <StatusBadge status={reservation.status} />
                    {invoice && (
                      <span className="badge badge--neutral">
                        Invoice {formatCurrency(invoice.amount)} · {invoice.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="booking-row__actions">
                  <button
                    type="button"
                    className="btn btn--quiet btn--sm"
                    onClick={() => viewConfirmation(reservation)}
                    disabled={busyId === reservation.id}
                  >
                    View
                  </button>

                  {invoice && (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => downloadInvoice(invoice.id)}
                      disabled={busyId === invoice.id}
                    >
                      Invoice
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => cancel(reservation.id)}
                      disabled={busyId === reservation.id}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {detail && (
        <Modal title="Reservation details" onClose={() => setDetail(null)}>
          <div className="stack-sm">
            {detail.confirmationCode && (
              <div className="summary__row">
                <span>Confirmation code</span>
                <strong>{detail.confirmationCode}</strong>
              </div>
            )}
            <div className="summary__row">
              <span>Hall</span>
              <strong>{detail.hallName}</strong>
            </div>
            <div className="summary__row">
              <span>Package</span>
              <strong>{detail.packageName}</strong>
            </div>
            <div className="summary__row">
              <span>Event date</span>
              <strong>{formatDate(detail.eventDate)}</strong>
            </div>
            <div className="summary__row">
              <span>Guests</span>
              <strong>{formatNumber(detail.guestCount)}</strong>
            </div>
            <div className="summary__row">
              <span>Status</span>
              <strong>{detail.status}</strong>
            </div>
            {detail.notes && (
              <>
                <hr className="divider" style={{ margin: '8px 0' }} />
                <div>
                  <p className="label-text">Notes</p>
                  <p className="muted" style={{ marginTop: 6 }}>
                    {detail.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
