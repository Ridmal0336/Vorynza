import { useEffect, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import Modal from '../../components/Modal';
import Tabs from '../../components/Tabs';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as cateringApi from '../../api/catering';
import { formatCurrency, titleCase } from '../../utils/format';
import { hasErrors, positiveNumber, required, validate } from '../../validation';
import { AdminHeader, YesNo } from './adminShared';

const emptyPackage = {
  name: '',
  category: '',
  price: '',
  description: '',
  vegetarian: false,
  active: true,
};

const emptyItem = {
  name: '',
  category: '',
  price: '',
  description: '',
  vegetarian: false,
  cateringPackageId: '',
  active: true,
};

export default function AdminCatering() {
  const [packages, setPackages] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);

  // { kind: 'package' | 'item', record: 'new' | entity }
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPackage);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgRes, itemRes] = await Promise.all([
        cateringApi.getCateringPackages(),
        cateringApi.getMenuItems(),
      ]);
      setPackages(pkgRes.data || []);
      setItems(itemRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load catering data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (kind, record) => {
    setApiMessage('');
    setApiErrors(null);
    setFieldErrors({});

    if (record === 'new') {
      setForm(kind === 'package' ? emptyPackage : emptyItem);
    } else if (kind === 'package') {
      setForm({
        name: record.name || '',
        category: record.category || '',
        price: String(record.price ?? ''),
        description: record.description || '',
        vegetarian: Boolean(record.vegetarian),
        active: Boolean(record.active),
      });
    } else {
      setForm({
        name: record.name || '',
        category: record.category || '',
        price: String(record.price ?? ''),
        description: record.description || '',
        vegetarian: Boolean(record.vegetarian),
        cateringPackageId:
          record.cateringPackageId != null ? String(record.cateringPackageId) : '',
        active: Boolean(record.active),
      });
    }

    setEditing({ kind, record });
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
      name: [() => required(form.name, 'Name is required')],
      category: [() => required(form.category, 'Category is required')],
      price: [
        () => required(form.price, 'Price is required'),
        () => positiveNumber(form.price, 'Price must be a positive number'),
      ],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const isPackage = editing.kind === 'package';
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      description: form.description.trim() || null,
      vegetarian: form.vegetarian,
      active: form.active,
      ...(isPackage
        ? {}
        : {
            cateringPackageId: form.cateringPackageId ? Number(form.cateringPackageId) : null,
          }),
    };

    setSaving(true);
    try {
      if (editing.record === 'new') {
        if (isPackage) await cateringApi.createCateringPackage(payload);
        else await cateringApi.createMenuItem(payload);
        setSuccess(isPackage ? 'Catering package created.' : 'Menu item created.');
      } else {
        if (isPackage) await cateringApi.updateCateringPackage(editing.record.id, payload);
        else await cateringApi.updateMenuItem(editing.record.id, payload);
        setSuccess(isPackage ? 'Catering package updated.' : 'Menu item updated.');
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

  const deactivate = async (kind, record) => {
    if (!window.confirm(`Deactivate ${record.name}?`)) return;
    setApiMessage('');
    setSuccess('');
    try {
      if (kind === 'package') await cateringApi.deleteCateringPackage(record.id);
      else await cateringApi.deleteMenuItem(record.id);
      setSuccess('Deactivated.');
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Deactivate failed');
    }
  };

  const renderTable = (kind, rows) => {
    if (rows.length === 0) {
      return (
        <EmptyState
          title={kind === 'package' ? 'No catering packages' : 'No menu items'}
          message="Add one so it appears in the customer catering menu and booking flow."
          actionLabel="Add"
          onAction={() => open(kind, 'new')}
        />
      );
    }

    return (
      <>
        <div className="table-toolbar">
          <span className="muted" style={{ fontSize: 14 }}>
            {rows.length} {rows.length === 1 ? 'record' : 'records'}
          </span>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => open(kind, 'new')}
          >
            {kind === 'package' ? 'Add catering package' : 'Add menu item'}
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price / guest</th>
                {kind === 'item' && <th>Package</th>}
                <th>Vegetarian</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong style={{ fontWeight: 500 }}>{row.name}</strong>
                    {row.description && (
                      <div className="muted" style={{ fontSize: 13 }}>
                        {row.description}
                      </div>
                    )}
                  </td>
                  <td>{titleCase(row.category)}</td>
                  <td>{formatCurrency(row.price)}</td>
                  {kind === 'item' && (
                    <td>
                      {packages.find((p) => p.id === row.cateringPackageId)?.name || '—'}
                    </td>
                  )}
                  <td>
                    <YesNo value={row.vegetarian} />
                  </td>
                  <td>
                    <YesNo value={row.active} />
                  </td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      onClick={() => open(kind, row)}
                    >
                      Edit
                    </button>
                    {row.active && (
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => deactivate(kind, row)}
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
      </>
    );
  };

  return (
    <div>
      <AdminHeader
        title="Catering"
        description="Per-guest catering packages and the à la carte dishes customers can add."
      />

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading catering data…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Tabs
          tabs={[
            {
              id: 'packages',
              label: `Catering packages (${packages.length})`,
              render: () => renderTable('package', packages),
            },
            {
              id: 'items',
              label: `Menu items (${items.length})`,
              render: () => renderTable('item', items),
            },
          ]}
        />
      )}

      {editing && (
        <Modal
          title={
            editing.record === 'new'
              ? editing.kind === 'package'
                ? 'Add catering package'
                : 'Add menu item'
              : `Edit ${editing.record.name}`
          }
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                type="submit"
                form="catering-form"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="catering-form" className="form-grid" onSubmit={save} noValidate>
            <FormError message={apiMessage} errors={apiErrors} />

            <label className="field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={onChange} />
              <FieldError error={fieldErrors.name} />
            </label>
            <label className="field">
              <span>Category</span>
              <input
                name="category"
                value={form.category}
                onChange={onChange}
                placeholder={editing.kind === 'package' ? 'BUFFET' : 'RICE / DESSERT / BEVERAGE'}
              />
              <FieldError error={fieldErrors.category} />
            </label>
            <label className="field">
              <span>Price per guest</span>
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

            {editing.kind === 'item' && (
              <label className="field">
                <span>Catering package</span>
                <select
                  name="cateringPackageId"
                  value={form.cateringPackageId}
                  onChange={onChange}
                >
                  <option value="">None</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="field form-grid__full">
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={onChange} />
            </label>
            <label className="check">
              <input
                type="checkbox"
                name="vegetarian"
                checked={form.vegetarian}
                onChange={onChange}
              />
              Vegetarian
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
