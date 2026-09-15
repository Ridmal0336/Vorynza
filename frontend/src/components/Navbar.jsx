import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, MenuIcon } from './Icons';

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isStaff = STAFF_ROLES.includes(user?.role);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={`site-header${open ? ' is-open' : ''}`}>
      <div className="site-header__inner">
        <Link to="/" className="brand">
          Vorynza
        </Link>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>

        <nav className="site-nav" aria-label="Main">
          <NavLink to="/halls">Venues</NavLink>
          <NavLink to="/packages">Packages</NavLink>
          <NavLink to="/catering">Catering</NavLink>
          <NavLink to="/book">Book</NavLink>
          {isAuthenticated && !isStaff && <NavLink to="/dashboard">My bookings</NavLink>}
          {isStaff && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="site-header__actions">
          {isAuthenticated ? (
            <>
              <span className="user-chip">
                <strong>{user?.fullName}</strong>
              </span>
              <button type="button" className="btn btn--quiet btn--sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--quiet btn--sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
