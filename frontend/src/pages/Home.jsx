import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PackageCard from '../components/PackageCard';
import { CardSkeletons, EmptyState, ErrorState } from '../components/States';
import { CalendarIcon, PackageIcon, SearchIcon } from '../components/Icons';
import * as packagesApi from '../api/packages';
import { unsplash } from '../utils/images';

const QUICK_LINKS = [
  {
    to: '/halls',
    icon: <SearchIcon />,
    title: 'Hotel Search',
    text: 'Filter venues by location, capacity, and theme.',
  },
  {
    to: '/packages',
    icon: <PackageIcon />,
    title: 'Wedding Packages',
    text: 'Curated décor, dining, and photography bundles.',
  },
  {
    to: '/book',
    icon: <CalendarIcon />,
    title: 'Book a Hall',
    text: 'Check a date and reserve in three steps.',
  },
];

export default function Home() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const featured = await packagesApi.getPackages({ featured: true });
        let list = featured.data || [];

        // Nothing flagged featured yet — fall back to the cheapest few so the row is never empty.
        if (list.length === 0) {
          const all = await packagesApi.getPackages();
          list = [...(all.data || [])]
            .sort((a, b) => Number(a.price) - Number(b.price))
            .slice(0, 6);
        }

        if (!cancelled) setPackages(list);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load packages');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <p className="hero__brand">Vorynza</p>
          <h1 className="hero__title">Your perfect wedding, reserved.</h1>
          <p className="hero__lead">
            Browse Sri Lanka&apos;s finest hotel ballrooms and garden pavilions, compare wedding
            packages, and hold your date — all in one place.
          </p>
          <div className="hero__actions">
            <Link to="/halls" className="btn btn--primary">
              Find a Venue
            </Link>
            <Link to="/packages" className="btn btn--on-dark">
              View Packages
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="quick-links">
            {QUICK_LINKS.map((item) => (
              <Link to={item.to} className="quick-link" key={item.title}>
                <span className="quick-link__icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Featured</p>
            <h2>Wedding packages</h2>
            <p className="lead">
              Everything from intimate garden ceremonies to full ballroom receptions.
            </p>
          </div>

          {loading ? (
            <CardSkeletons count={2} />
          ) : error ? (
            <ErrorState message={error} />
          ) : packages.length === 0 ? (
            <EmptyState
              title="No packages published yet"
              message="Wedding packages will appear here as soon as our hotels publish them."
              actionLabel="Browse venues"
              actionTo="/halls"
            />
          ) : (
            <div className="scroller">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} actionTo={`/book?packageId=${pkg.id}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="feature-row">
            <div className="feature-row__media">
              <img
                src={unsplash('photo-1519225421980-715cb0215aed', 1200)}
                alt="Guests seated at a hotel wedding reception"
                loading="lazy"
              />
            </div>
            <div className="stack">
              <p className="eyebrow">Why Vorynza</p>
              <h2>One calm place for every detail</h2>
              <p className="lead">
                We work directly with hotel banquet teams, so what you see is what you can book —
                real halls, real capacities, real availability.
              </p>
              <ul className="tick-list">
                <li>Live date availability for every hall</li>
                <li>Transparent pricing with catering estimates before you commit</li>
                <li>Invoices and payment history in your dashboard</li>
                <li>One coordinator from enquiry to event day</li>
              </ul>
              <div className="row" style={{ marginTop: 8 }}>
                <Link to="/halls" className="btn btn--primary">
                  Find a Venue
                </Link>
                <Link to="/catering" className="btn btn--secondary">
                  Explore catering
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
