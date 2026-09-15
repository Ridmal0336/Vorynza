import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <span className="brand">Vorynza</span>
            <p className="site-footer__tag">
              Wedding halls, packages, and catering at Sri Lanka&apos;s finest hotels.
            </p>
          </div>

          <nav className="site-footer__links" aria-label="Footer">
            <Link to="/about">About</Link>
            <Link to="/halls">Hotels</Link>
            <Link to="/packages">Packages</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login">Admin Login</Link>
          </nav>
        </div>

        <p className="site-footer__base">
          © {new Date().getFullYear()} Vorynza — Wedding Hotel Reservation System
        </p>
      </div>
    </footer>
  );
}
