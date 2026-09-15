import { useEffect, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as hallsApi from '../../api/halls';
import * as hotelsApi from '../../api/hotels';
import { formatCurrency, formatNumber } from '../../utils/format';
import { hasErrors, positiveNumber, required, validate } from '../../validation';
import { AdminHeader, TableToolbar, YesNo, useTableView } from './adminShared';

const emptyForm = {
  hotelId: '',
  name: '',
  capacity: '',
  decorationTheme: '',
  price: '',
  imageUrls: '',
  averageRating: '',
  active: true,
};

export default function AdminHalls() {
  const [halls, setHalls] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const view = useTableView(halls, ['name', 'hotelName', 'decorationTheme']);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [hallRes, hotelRes] = await Promise.all([
        hallsApi.getHalls(),
        hotelsApi.getHotels().catch(() => ({ data: [] })),
      ]);
      setHalls(hallRes.data || []);
      setHotels(hotelRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setApiMessage('');
    setApiErrors(null);
    setEditing('new');
  };

  const openEdit = (hall) => {
    setForm({
      hotelId: String(hall.hotelId ?? ''),
      name: hall.name || '',
      capacity: String(hall.capacity ?? ''),
      decorationTheme: hall.decorationTheme || '',
      price: String(hall.price ?? ''),
      imageUrls: hall.imageUrls || '',
      averageRating: hall.averageRating != null ? String(hall.averageRating) : '',
      active: Boolean(hall.active),
    });
    setFieldErrors({});
    setApiMessage('');
    setApiErrors(null);
    setEditing(hall);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setApiMessage('');
    setApiErrors(null);

    const errors = validate({
      hotelId: [() => required(form.hotelId, 'Hotel is required')],
      name: [() => required(form.name, 'Name is required')],
      capacity: [
        () => required(form.capacity, 'Capacity is required'),
        () => positiveNumber(form.capacity, 'Capacity must be a positive number'),
      ],
      price: [
        () => required(form.price, 'Price is required'),
        () => (Number(form.price) < 0 ? 'Price cannot be negative' : null),
      ],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const payload = {
      hotelId: Number(form.hotelId),
      name: form.name.trim(),
      capacity: Number(form.capacity),
      decorationTheme: form.decorationTheme.trim() || null,
      price: Number(form.price),
      imageUrls: form.imageUrls.trim() || null,
      averageRating: form.averageRating === '' ? null : Number(form.averageRating),
      active: form.active,
    };

    setSaving(true);
    try {
      if (editing === 'new') {
        await hallsApi.createHall(payload);
        setSuccess('Hall created.');
      } else {
        await hallsApi.updateHall(editing.id, payload);
        setSuccess('Hall updated.');
      }
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

  const deactivate = async (hall) => {
    if (!window.confirm(`Deactivate ${hall.name}?`)) return;
    setApiMessage('');
    setSuccess('');
    try {
      await hallsApi.deleteHall(hall.id);
      setSuccess('Hall deactivated.');
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Deactivate failed');
    }
  };

  return (
    <div>
      <AdminHeader
        title="Halls"
        description="Bookable venues, their capacity, and hire pricing."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
            Add hall
          </button>
        }
      />

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading halls…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <TableToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Search by hall, hotel, or theme"
          />

          {view.total === 0 ? (
            <EmptyState
              title="No halls found"
              message="Add a hall so customers can start reserving dates."
              actionLabel="Add hall"
              onAction={openNew}
            />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hall</th>
                      <th>Hotel</th>
                      <th>Capacity</th>
                      <th>Theme</th>
                      <th>Price</th>
                      <th>Rating</th>
                      <th>Active</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {view.visible.map((hall) => (
                      <tr key={hall.id}>
                        <td>
                          <strong style={{ fontWeight: 500 }}>{hall.name}</strong>
                        </td>
                        <td>{hall.hotelName}</td>
                        <td>{formatNumber(hall.capacity)}</td>
                        <td>{hall.decorationTheme || '—'}</td>
                        <td>{formatCurrency(hall.price)}</td>
                        <td>{hall.averageRating != null ? Number(hall.averageRating).toFixed(1) : '—'}</td>
                        <td>
                          <YesNo value={hall.active} />
                        </td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => openEdit(hall)}
                          >
                            Edit
                          </button>
                          {hall.active && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => deactivate(hall)}
                            >
                              Deactivate
                            </button>
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
          title={editing === 'new' ? 'Add hall' : `Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" form="hall-form" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save hall'}
              </button>
            </>
          }
        >
          <form id="hall-form" className="form-grid" onSubmit={save} noValidate>
            <FormError message={apiMessage} errors={apiErrors} />

            <label className="field">
              <span>Hotel</span>
              <select name="hotelId" value={form.hotelId} onChange={onChange}>
                <option value="">Select hotel</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
              <FieldError error={fieldErrors.hotelId} />
            </label>
            <label className="field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={onChange} />
              <FieldError error={fieldErrors.name} />
            </label>
            <label className="field">
              <span>Capacity</span>
              <input name="capacity" type="number" min="1" value={form.capacity} onChange={onChange} />
              <FieldError error={fieldErrors.capacity} />
            </label>
            <label className="field">
              <span>Hire price</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={onChange}
              />
              <FieldError error={fieldErrors.price} />
            </label>
            <label className="field">
              <span>Decoration theme</span>
              <input name="decorationTheme" value={form.decorationTheme} onChange={onChange} />
              <FieldError error={fieldErrors.decorationTheme} />
            </label>
            <label className="field">
              <span>Average rating</span>
              <input
                name="averageRating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.averageRating}
                onChange={onChange}
              />
              <FieldError error={fieldErrors.averageRating} />
            </label>
            <label className="field form-grid__full">
              <span>Image URLs (comma separated)</span>
              <input
                name="imageUrls"
                value={form.imageUrls}
                onChange={onChange}
                placeholder="https://…, https://…"
              />
              <FieldError error={fieldErrors.imageUrls} />
            </label>
            <label className="check form-grid__full">
              <input type="checkbox" name="active" checked={form.active} onChange={onChange} />
              Active and bookable
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
