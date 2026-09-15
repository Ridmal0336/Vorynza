import { useEffect, useMemo, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as usersApi from '../../api/users';
import { formatDateTime } from '../../utils/format';
import { email as emailRule, hasErrors, required, validate } from '../../validation';
import { AdminHeader, TableToolbar, useTableView } from './adminShared';

const ROLES = ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: 'CUSTOMER',
    active: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => users.filter((user) => !roleFilter || user.role === roleFilter),
    [users, roleFilter]
  );

  const view = useTableView(filtered, ['fullName', 'email', 'phone'], 12);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (user) => {
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'CUSTOMER',
      active: Boolean(user.active),
    });
    setFieldErrors({});
    setApiMessage('');
    setApiErrors(null);
    setEditing(user);
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
      fullName: [() => required(form.fullName, 'Full name is required')],
      email: [() => required(form.email, 'Email is required'), () => emailRule(form.email)],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      await usersApi.updateUser(editing.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        role: form.role,
        active: form.active,
      });
      setSuccess('User updated.');
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

  const deactivate = async (user) => {
    if (!window.confirm(`Deactivate ${user.fullName}?`)) return;
    setApiMessage('');
    setSuccess('');
    try {
      await usersApi.deactivateUser(user.id);
      setSuccess('User deactivated.');
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Deactivate failed');
    }
  };

  return (
    <div>
      <AdminHeader title="Users" description="Accounts, roles, and access across the platform." />

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading users…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <TableToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Search by name, email, or phone"
          >
            <label className="field">
              <span>Role</span>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All roles</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </TableToolbar>

          {view.total === 0 ? (
            <EmptyState title="No users found" message="Nothing matches this search or role." />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {view.visible.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong style={{ fontWeight: 500 }}>{user.fullName}</strong>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone || '—'}</td>
                        <td>
                          <span className="badge badge--neutral">{user.role}</span>
                        </td>
                        <td>{formatDateTime(user.createdAt)}</td>
                        <td>
                          <StatusBadge status={user.active ? 'ACTIVE' : 'INACTIVE'} />
                        </td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => openEdit(user)}
                          >
                            Edit
                          </button>
                          {user.active && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => deactivate(user)}
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
          title={`Edit ${editing.fullName}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" form="user-form" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          }
        >
          <form id="user-form" className="form-grid" onSubmit={save} noValidate>
            <FormError message={apiMessage} errors={apiErrors} />

            <label className="field">
              <span>Full name</span>
              <input name="fullName" value={form.fullName} onChange={onChange} />
              <FieldError error={fieldErrors.fullName} />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} />
              <FieldError error={fieldErrors.email} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input name="phone" value={form.phone} onChange={onChange} />
              <FieldError error={fieldErrors.phone} />
            </label>
            <label className="field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={onChange}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <FieldError error={fieldErrors.role} />
            </label>
            <label className="field form-grid__full">
              <span>Address</span>
              <textarea name="address" value={form.address} onChange={onChange} />
              <FieldError error={fieldErrors.address} />
            </label>
            <label className="check form-grid__full">
              <input type="checkbox" name="active" checked={form.active} onChange={onChange} />
              Account active
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
