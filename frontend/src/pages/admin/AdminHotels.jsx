import { useEffect, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as hotelsApi from '../../api/hotels';
import { hasErrors, required, validate } from '../../validation';
import { AdminHeader, TableToolbar, useTableView } from './adminShared';

const emptyForm = { name: '', location: '', description: '', contact: '' };

export default function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);

  const [editing, setEditing] = useState(null); // null | 'new' | hotel
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const view = useTableView(hotels, ['name', 'location', 'contact']);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hotelsApi.getHotels();
      setHotels(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load hotels');
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

  const openEdit = (hotel) => {
    setForm({
      name: hotel.name || '',
      location: hotel.location || '',
      description: hotel.description || '',
      contact: hotel.contact || '',
    });
    setFieldErrors({});
    setApiMessage('');
    setApiErrors(null);
    setEditing(hotel);
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
      name: [() => required(form.name, 'Name is required')],
      location: [() => required(form.location, 'Location is required')],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      description: form.description.trim() || null,
      contact: form.contact.trim() || null,
    };

    setSaving(true);
    try {
      if (editing === 'new') {
        await hotelsApi.createHotel(payload);
        setSuccess('Hotel created.');
      } else {
        await hotelsApi.updateHotel(editing.id, payload);
        setSuccess('Hotel updated.');
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

  const remove = async (hotel) => {
    if (!window.confirm(`Delete ${hotel.name}?`)) return;
    setApiMessage('');
    setSuccess('');
    try {
      await hotelsApi.deleteHotel(hotel.id);
      setSuccess('Hotel deleted.');
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <AdminHeader
        title="Hotels"
        description="Properties that host wedding halls and packages."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
            Add hotel
          </button>
        }
      />

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading hotels…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <TableToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Search by name, location, or contact"
          />

          {view.total === 0 ? (
            <EmptyState
              title="No hotels found"
              message="Add your first property to start publishing halls and packages."
              actionLabel="Add hotel"
              onAction={openNew}
            />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Contact</th>
                      <th>Description</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {view.visible.map((hotel) => (
                      <tr key={hotel.id}>
                        <td>
                          <strong style={{ fontWeight: 500 }}>{hotel.name}</strong>
                        </td>
                        <td>{hotel.location}</td>
                        <td>{hotel.contact || '—'}</td>
                        <td className="muted">{hotel.description || '—'}</td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => openEdit(hotel)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => remove(hotel)}
                          >
                            Delete
                          </button>
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
          title={editing === 'new' ? 'Add hotel' : `Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" form="hotel-form" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save hotel'}
              </button>
            </>
          }
        >
          <form id="hotel-form" className="form-grid" onSubmit={save} noValidate>
            <FormError message={apiMessage} errors={apiErrors} />

            <label className="field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={onChange} />
              <FieldError error={fieldErrors.name} />
            </label>
            <label className="field">
              <span>Location</span>
              <input name="location" value={form.location} onChange={onChange} />
              <FieldError error={fieldErrors.location} />
            </label>
            <label className="field">
              <span>Contact</span>
              <input name="contact" value={form.contact} onChange={onChange} />
              <FieldError error={fieldErrors.contact} />
            </label>
            <label className="field form-grid__full">
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={onChange} />
              <FieldError error={fieldErrors.description} />
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
