import { useEffect, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import { LoadingText } from '../../components/States';
import { useAuth } from '../../context/AuthContext';
import * as usersApi from '../../api/users';
import { email as emailRule, hasErrors, minLength, required, validate } from '../../validation';

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    usersApi
      .getMe()
      .then((res) => {
        if (cancelled) return;
        const me = res.data || {};
        setForm({
          fullName: me.fullName || '',
          email: me.email || '',
          phone: me.phone || '',
          address: me.address || '',
        });
      })
      .catch((err) => {
        if (!cancelled) setApiMessage(err.message || 'Could not load your profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setApiMessage('');
    setApiErrors(null);
    setSuccess('');

    const errors = validate({
      fullName: [() => required(form.fullName, 'Full name is required')],
      email: [() => required(form.email, 'Email is required'), () => emailRule(form.email)],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      const res = await usersApi.updateUser(user.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      });
      updateUser({ ...user, ...(res.data || {}) });
      setSuccess('Profile updated.');
    } catch (err) {
      setApiMessage(err.message || 'Could not save your profile');
      setApiErrors(err.errors || null);
      if (err.errors) setFieldErrors((prev) => ({ ...prev, ...err.errors }));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setApiMessage('');
    setApiErrors(null);
    setSuccess('');

    const errors = validate({
      currentPassword: [() => required(passwordForm.currentPassword, 'Current password is required')],
      newPassword: [
        () => required(passwordForm.newPassword, 'New password is required'),
        () => minLength(passwordForm.newPassword, 8, 'New password must be at least 8 characters'),
      ],
    });
    setPasswordErrors(errors);
    if (hasErrors(errors)) return;

    setChanging(true);
    try {
      await usersApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setSuccess('Password updated.');
    } catch (err) {
      setApiMessage(err.message || 'Could not change your password');
      setApiErrors(err.errors || null);
      if (err.errors) setPasswordErrors((prev) => ({ ...prev, ...err.errors }));
    } finally {
      setChanging(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-head__text">
          <p className="eyebrow">Dashboard</p>
          <h1>My profile</h1>
          <p className="lead">Keep your contact details current so coordinators can reach you.</p>
        </div>
      </div>

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading your profile…</LoadingText>
      ) : (
        <div className="stack" style={{ gap: 32, marginTop: 24 }}>
          <form className="panel" onSubmit={saveProfile} noValidate>
            <h2 style={{ marginBottom: 20 }}>Contact details</h2>
            <div className="form-grid">
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
              <label className="field form-grid__full">
                <span>Address</span>
                <textarea name="address" value={form.address} onChange={onChange} />
                <FieldError error={fieldErrors.address} />
              </label>
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              style={{ marginTop: 20 }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <form className="panel" onSubmit={changePassword} noValidate>
            <h2 style={{ marginBottom: 20 }}>Password</h2>
            <div className="form-grid">
              <label className="field">
                <span>Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                />
                <FieldError error={passwordErrors.currentPassword} />
              </label>
              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                />
                <FieldError error={passwordErrors.newPassword} />
              </label>
            </div>
            <button
              type="submit"
              className="btn btn--secondary"
              style={{ marginTop: 20 }}
              disabled={changing}
            >
              {changing ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
