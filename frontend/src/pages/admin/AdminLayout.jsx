import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/admin/overview', label: 'Overview', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/hotels', label: 'Hotels', roles: ['ADMIN'] },
  { to: '/admin/halls', label: 'Halls', roles: ['ADMIN'] },
  { to: '/admin/packages', label: 'Packages', roles: ['ADMIN'] },
  { to: '/admin/catering', label: 'Catering', roles: ['ADMIN'] },
  { to: '/admin/reservations', label: 'Reservations', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/invoices', label: 'Invoices', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/admin/reports', label: 'Reports', roles: ['ADMIN', 'MANAGER'] },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const links = LINKS.filter((link) => link.roles.includes(user?.role));

  return (
    <div className="container">
      <div className="shell-layout">
        <aside className="shell-sidebar" aria-label="Admin sections">
          <p className="shell-sidebar__title">{user?.role === 'MANAGER' ? 'Manager' : 'Admin'}</p>

          {links.map((link) => (
            <NavLink to={link.to} className="shell-nav-link" key={link.to}>
              {link.label}
            </NavLink>
          ))}
        </aside>

        <div className="shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
