import { useEffect, useMemo, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as hallsApi from '../../api/halls';
import * as packagesApi from '../../api/packages';
import * as reservationsApi from '../../api/reservations';
import { formatDate, formatNumber } from '../../utils/format';
import { futureDate, hasErrors, positiveNumber, required, validate } from '../../validation';
import { AdminHeader, TableToolbar, useTableView } from './adminShared';

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [halls, setHalls] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ hallId: '', packageId: '', eventDate: '', guestCount: '', notes: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(
    () => reservations.filter((r) => !statusFilter || r.status === statusFilter),
    [reservations, statusFilter]
  );

  const view = useTableView(filtered, ['customerName', 'customerEmail', 'hallName', 'packageName'], 12);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [resRes, hallRes, pkgRes] = await Promise.all([
        reservationsApi.getReservations(),
        hallsApi.getHalls().catch(() => ({ data: [] })),
        packagesApi.getPackages().catch(() => ({ data: [] })),
      ]);
      setReservations(resRes.data || []);
      setHalls(hallRes.data || []);
      setPackages(pkgRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (reservation) => {
    setForm({
      hallId: String(reservation.hallId ?? ''),
      packageId: String(reservation.packageId ?? ''),
      eventDate: reservation.eventDate || '',
      guestCount: String(reservation.guestCount ?? ''),
      notes: reservation.notes || '',
    });
    setFieldErrors({});
    setApiMessage('');
    setApiErrors(null);
    setEditing(reservation);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setApiMessage('');
    setApiErrors(null);

    const errors = validate({
      hallId: [() => required(form.hallId, 'Hall is required')],
      packageId: [() => required(form.packageId, 'Package is required')],
      eventDate: [
        () => required(form.eventDate, 'Event date is required'),
        () => futureDate(form.eventDate),
      ],
      guestCount: [
        () => required(form.guestCount, 'Guest count is required'),
        () => positiveNumber(form.guestCount, 'Guest count must be a positive number'),
      ],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      await reservationsApi.updateReservation(editing.id, {
        userId: editing.userId ?? null,
        hallId: Number(form.hallId),
        packageId: Number(form.packageId),
        eventDate: form.eventDate,
        guestCount: Number(form.guestCount),
        notes: form.notes.trim() || null,
      });
      setSuccess('Reservation updated.');
      setEditing(null);
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Save failed');
      setApiErrors(err.errors || null);
      if (err.errors) setFieldErrors((prev) => ({ ...prev, ...err.errors }));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (reservation) => {
    if (!window.confirm(`Cancel reservation #${reservation.id}?`)) return;
    setApiMessage('');
    setSuccess('');
    try {
      await reservationsApi.cancelReservation(reservation.id);
      setSuccess('Reservation cancelled.');
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Cancel failed');
    }
  };

  const setStatus = async (reservation, status) => {
    setApiMessage('');
    setSuccess('');
    try {
      await reservationsApi.updateReservationStatus(reservation.id, status);
      setSuccess(`Reservation marked ${status}.`);
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Status update failed');
    }
  };

  const viewDetail = async (reservation) => {
    setApiMessage('');
    try {
      const res = await reservationsApi.getReservationConfirmation(reservation.id);
      setDetail({ ...reservation, ...res.data });
    } catch {
      setDetail(reservation);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Reservations"
        description="Every booking across all hotels, with edit and cancellation controls."
      />

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading reservations…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <TableToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Search by customer, hall, or package"
          >
            <label className="field">
              <span>Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </TableToolbar>

          {view.total === 0 ? (
            <EmptyState
              title="No reservations found"
              message="Nothing matches this search or status filter."
            />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Customer</th>
                      <th>Hall</th>
                      <th>Package</th>
                      <th>Date</th>
                      <th>Guests</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {view.visible.map((reservation) => (
                      <tr key={reservation.id}>
                        <td>{reservation.id}</td>
                        <td>
                          <strong style={{ fontWeight: 500 }}>{reservation.customerName}</strong>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {reservation.customerEmail}
                          </div>
                        </td>
                        <td>{reservation.hallName}</td>
                        <td>{reservation.packageName}</td>
                        <td>{formatDate(reservation.eventDate)}</td>
                        <td>{formatNumber(reservation.guestCount)}</td>
                        <td>
                          <StatusBadge status={reservation.status} />
                        </td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => viewDetail(reservation)}
                          >
                            View
                          </button>
                          {reservation.status !== 'CANCELLED' && (
                            <>
                              {reservation.status === 'PENDING' && (
                                <button
                                  type="button"
                                  className="btn btn--quiet btn--sm"
                                  onClick={() => setStatus(reservation, 'CONFIRMED')}
                                >
                                  Confirm
                                </button>
                              )}
                              {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                                <button
                                  type="button"
                                  className="btn btn--quiet btn--sm"
                                  onClick={() => setStatus(reservation, 'COMPLETED')}
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn--quiet btn--sm"
                                onClick={() => openEdit(reservation)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn--danger btn--sm"
                                onClick={() => cancel(reservation)}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={view.page}
                pageCount={view.pageCount}
                total={view.total}
                onChange={view.setPage}
              />
            </>
          )}
        </>
      )}

      {editing && (
        <Modal
          title={`Edit reservation #${editing.id}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                type="submit"
                form="reservation-form"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          }
        >
          <form id="reservation-form" className="form-grid" onSubmit={save} noValidate>
            <FormError message={apiMessage} errors={apiErrors} />

            <label className="field">
              <span>Hall</span>
              <select name="hallId" value={form.hallId} onChange={onChange}>
                <option value="">Select hall</option>
                {halls.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name} (cap {hall.capacity})
                  </option>
                ))}
              </select>
              <FieldError error={fieldErrors.hallId} />
            </label>
            <label className="field">
              <span>Package</span>
              <select name="packageId" value={form.packageId} onChange={onChange}>
                <option value="">Select package</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </select>
              <FieldError error={fieldErrors.packageId} />
            </label>
            <label className="field">
              <span>Event date</span>
              <input name="eventDate" type="date" value={form.eventDate} onChange={onChange} />
              <FieldError error={fieldErrors.eventDate} />
            </label>
            <label className="field">
              <span>Guest count</span>
              <input
                name="guestCount"
                type="number"
                min="1"
                value={form.guestCount}
                onChange={onChange}
              />
              <FieldError error={fieldErrors.guestCount} />
            </label>
            <label className="field form-grid__full">
              <span>Notes</span>
              <textarea name="notes" value={form.notes} onChange={onChange} />
            </label>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={`Reservation #${detail.id}`} onClose={() => setDetail(null)}>
          <div className="stack-sm">
            {detail.confirmationCode && (
              <div className="summary__row">
                <span>Confirmation code</span>
                <strong>{detail.confirmationCode}</strong>
              </div>
            )}
            <div className="summary__row">
              <span>Customer</span>
              <strong>{detail.customerName}</strong>
            </div>
            <div className="summary__row">
              <span>Email</span>
              <strong>{detail.customerEmail}</strong>
            </div>
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
                <p className="label-text">Notes</p>
                <p className="muted">{detail.notes}</p>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
