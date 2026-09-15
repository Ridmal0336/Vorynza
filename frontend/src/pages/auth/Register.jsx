import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormError, { FieldError } from '../../components/FormError';
import { useAuth } from '../../context/AuthContext';
import { email, hasErrors, minLength, required, validate } from '../../validation';

const empty = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
};

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setApiMessage('');
    setApiErrors(null);

    const errors = validate({
      fullName: [() => required(form.fullName, 'Full name is required')],
      email: [() => required(form.email, 'Email is required'), () => email(form.email)],
      password: [
        () => required(form.password, 'Password is required'),
        () => minLength(form.password, 8, 'Password must be at least 8 characters'),
      ],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      });
      navigate('/dashboard/bookings', { replace: true });
    } catch (err) {
      setApiMessage(err.message || 'Registration failed');
      setApiErrors(err.errors || null);
      if (err.errors) setFieldErrors((prev) => ({ ...prev, ...err.errors }));
    }
  };

  return (
    <div className="container">
      <div className="auth-page">
        <div className="auth-page__head">
          <p className="eyebrow">Vorynza</p>
          <h1>Create account</h1>
          <p className="muted">Reserve halls, packages, and catering in one place.</p>
        </div>

        <form className="form-stack" onSubmit={onSubmit} noValidate>
          <FormError message={apiMessage} errors={apiErrors} />

          <label className="field">
            <span>Full name</span>
            <input name="fullName" value={form.fullName} onChange={onChange} />
            <FieldError error={fieldErrors.fullName} />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" value={form.email} onChange={onChange} />
            <FieldError error={fieldErrors.email} />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={onChange}
            />
            <FieldError error={fieldErrors.password} />
          </label>

          <label className="field">
            <span>Phone</span>
            <input name="phone" value={form.phone} onChange={onChange} />
            <FieldError error={fieldErrors.phone} />
          </label>

          <label className="field">
            <span>Address</span>
            <textarea name="address" value={form.address} onChange={onChange} />
            <FieldError error={fieldErrors.address} />
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="muted">
          Already registered?{' '}
          <Link to="/login" className="link-gold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
