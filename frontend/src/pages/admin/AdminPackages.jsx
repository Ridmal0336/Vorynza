import { useEffect, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as hotelsApi from '../../api/hotels';
import * as packagesApi from '../../api/packages';
import { formatCurrency } from '../../utils/format';
import { hasErrors, required, validate } from '../../validation';
import { AdminHeader, TableToolbar, YesNo, useTableView } from './adminShared';

const emptyForm = {
  hotelId: '',
  name: '',
  price: '',
  inclusions: '',
  description: '',
  packageType: '',
  imageUrl: '',
  discountPercent: '',
  featured: false,
  active: true,
};

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
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

  const view = useTableView(packages, ['name', 'hotelName', 'packageType', 'inclusions']);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgRes, hotelRes] = await Promise.all([
        packagesApi.getPackages(),
        hotelsApi.getHotels().catch(() => ({ data: [] })),
      ]);
      setPackages(pkgRes.data || []);
      setHotels(hotelRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
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

  const openEdit = (pkg) => {
    setForm({
      hotelId: String(pkg.hotelId ?? ''),
      name: pkg.name || '',
      price: String(pkg.price ?? ''),
      inclusions: pkg.inclusions || '',
      description: pkg.description || '',
      packageType: pkg.packageType || '',
      imageUrl: pkg.imageUrl || '',
      discountPercent: pkg.discountPercent != null ? String(pkg.discountPercent) : '',
      featured: Boolean(pkg.featured),
      active: Boolean(pkg.active),
    });
    setFieldErrors({});
    setApiMessage('');
    setApiErrors(null);
    setEditing(pkg);
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
      price: [
        () => required(form.price, 'Price is required'),
        () => (Number(form.price) < 0 ? 'Price cannot be negative' : null),
      ],
      inclusions: [() => required(form.inclusions, 'Inclusions are required')],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const payload = {
      hotelId: Number(form.hotelId),
      name: form.name.trim(),
      price: Number(form.price),
      inclusions: form.inclusions.trim(),
      description: form.description.trim() || null,
      packageType: form.packageType.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      discountPercent: form.discountPercent === '' ? null : Number(form.discountPercent),
      featured: form.featured,
      active: form.active,
    };

    setSaving(true);
    try {
      if (editing === 'new') {
        await packagesApi.createPackage(payload);
        setSuccess('Package created.');
      } else {
        await packagesApi.updatePackage(editing.id, payload);
        setSuccess('Package updated.');
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

  const deactivate = async (pkg) => {
    if (!window.confirm(`Deactivate ${pkg.name}?`)) return;
    setApiMessage('');
    setSuccess('');
    try {
      await packagesApi.deletePackage(pkg.id);
      setSuccess('Package deactivated.');
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Deactivate failed');
    }
  };

  return (
    <div>
      <AdminHeader
        title="Packages"
        description="Wedding bundles offered by each hotel, with pricing and inclusions."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
            Add package
          </button>
        }
      />

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading packages…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <TableToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Search by package, hotel, or type"
          />

          {view.total === 0 ? (
            <EmptyState
              title="No packages found"
              message="Publish a package so it appears on the customer packages page."
              actionLabel="Add package"
              onAction={openNew}
            />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>Hotel</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Featured</th>
                      <th>Active</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {view.visible.map((pkg) => (
                      <tr key={pkg.id}>
                        <td>
                          <strong style={{ fontWeight: 500 }}>{pkg.name}</strong>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {pkg.inclusions}
                          </div>
                        </td>
                        <td>{pkg.hotelName}</td>
                        <td>{pkg.packageType || '—'}</td>
                        <td>{formatCurrency(pkg.price)}</td>
                        <td>
                          {Number(pkg.discountPercent) > 0
                            ? `${Number(pkg.discountPercent)}%`
                            : '—'}
                        </td>
                        <td>
                          <YesNo value={pkg.featured} />
                        </td>
                        <td>
                          <YesNo value={pkg.active} />
                        </td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => openEdit(pkg)}
                          >
                            Edit
                          </button>
                          {pkg.active && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => deactivate(pkg)}
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
          title={editing === 'new' ? 'Add package' : `Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                type="submit"
                form="package-form"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save package'}
              </button>
            </>
          }
        >
          <form id="package-form" className="form-grid" onSubmit={save} noValidate>
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
              <span>Price</span>
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
              <span>Type</span>
              <input
                name="packageType"
                value={form.packageType}
                onChange={onChange}
                placeholder="PREMIUM / STANDARD"
              />
              <FieldError error={fieldErrors.packageType} />
            </label>
            <label className="field">
              <span>Discount %</span>
              <input
                name="discountPercent"
                type="number"
                min="0"
                step="0.01"
                value={form.discountPercent}
                onChange={onChange}
              />
              <FieldError error={fieldErrors.discountPercent} />
            </label>
            <label className="field">
              <span>Image URL</span>
              <input name="imageUrl" value={form.imageUrl} onChange={onChange} />
              <FieldError error={fieldErrors.imageUrl} />
            </label>
            <label className="field form-grid__full">
              <span>Inclusions (comma separated)</span>
              <textarea name="inclusions" value={form.inclusions} onChange={onChange} />
              <FieldError error={fieldErrors.inclusions} />
            </label>
            <label className="field form-grid__full">
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={onChange} />
              <FieldError error={fieldErrors.description} />
            </label>
            <label className="check">
              <input type="checkbox" name="featured" checked={form.featured} onChange={onChange} />
              Featured on the homepage
            </label>
            <label className="check">
              <input type="checkbox" name="active" checked={form.active} onChange={onChange} />
              Active
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
