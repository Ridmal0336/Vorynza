import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/dashboard/bookings', label: 'My Bookings' },
  { to: '/dashboard/profile', label: 'My Profile' },
  { to: '/dashboard/payments', label: 'Payment History' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container">
      <div className="shell-layout">
        <aside className="shell-sidebar" aria-label="Dashboard">
          <p className="shell-sidebar__title">{user?.fullName || 'My account'}</p>

          {LINKS.map((link) => (
            <NavLink to={link.to} className="shell-nav-link" key={link.to}>
              {link.label}
            </NavLink>
          ))}

          <div className="shell-sidebar__foot">
            <button type="button" className="btn btn--quiet btn--sm btn--block" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <div className="shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
