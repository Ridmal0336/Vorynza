import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormError, { FieldError } from '../../components/FormError';
import { useAuth } from '../../context/AuthContext';
import { email, hasErrors, required, validate } from '../../validation';

const STAFF_ROLES = ['ADMIN', 'MANAGER'];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
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
      email: [() => required(form.email, 'Email is required'), () => email(form.email)],
      password: [() => required(form.password, 'Password is required')],
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    try {
      const res = await login(form.email.trim(), form.password);
      const role = res?.data?.user?.role;
      const fallback = STAFF_ROLES.includes(role) ? '/admin' : '/dashboard/bookings';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setApiMessage(err.message || 'Login failed');
      setApiErrors(err.errors || null);
      if (err.errors) setFieldErrors((prev) => ({ ...prev, ...err.errors }));
    }
  };

  return (
    <div className="container">
      <div className="auth-page">
        <div className="auth-page__head">
          <p className="eyebrow">Vorynza</p>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage your wedding reservation.</p>
        </div>

        <form className="form-stack" onSubmit={onSubmit} noValidate>
          <FormError message={apiMessage} errors={apiErrors} />

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
            />
            <FieldError error={fieldErrors.email} />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={onChange}
            />
            <FieldError error={fieldErrors.password} />
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="muted">
          New here?{' '}
          <Link to="/register" className="link-gold">
            Create an account
          </Link>
        </p>

        <div className="demo-hint">
          Demo admin: <strong>admin@vorynza.com</strong> / <strong>Password123!</strong>
          <br />
          Demo customer: <strong>customer@vorynza.com</strong> / <strong>Password123!</strong>
        </div>
      </div>
    </div>
  );
}
