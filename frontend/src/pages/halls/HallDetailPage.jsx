import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Carousel from '../../components/Carousel';
import Tabs from '../../components/Tabs';
import PackageCard from '../../components/PackageCard';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import { PinIcon, StarIcon } from '../../components/Icons';
import * as hallsApi from '../../api/halls';
import * as hotelsApi from '../../api/hotels';
import * as packagesApi from '../../api/packages';
import * as cateringApi from '../../api/catering';
import { formatCurrency, formatNumber, todayIso } from '../../utils/format';
import { galleryFor } from '../../utils/images';

/** Standard banquet facilities — presentational, the hall entity has no facilities column. */
const FACILITIES = [
  'Air-conditioned hall',
  'Raised stage & backdrop',
  'Bridal changing suite',
  'On-site parking',
  'Professional sound & lighting',
  'In-house catering kitchen',
];

const DEMO_REVIEWS = [
  {
    name: 'Nimali & Kasun',
    rating: 5,
    text: 'The banquet team handled every detail. Our 220 guests were seated and served without a single hiccup.',
  },
  {
    name: 'Dilani P.',
    rating: 4,
    text: 'Beautiful room and great lighting for photographs. Parking filled up quickly, so plan for valet.',
  },
];

export default function HallDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hall, setHall] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [packages, setPackages] = useState([]);
  const [catering, setCatering] = useState({ packages: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ date: '', guests: '', packageId: '' });
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const hallRes = await hallsApi.getHall(id);
      const found = hallRes.data;
      setHall(found);

      const [hotelRes, pkgRes, cPkgRes, menuRes] = await Promise.all([
        found?.hotelId ? hotelsApi.getHotel(found.hotelId).catch(() => null) : null,
        packagesApi.getPackages().catch(() => ({ data: [] })),
        cateringApi.getCateringPackages().catch(() => ({ data: [] })),
        cateringApi.getMenuItems().catch(() => ({ data: [] })),
      ]);

      setHotel(hotelRes?.data || null);
      setPackages((pkgRes.data || []).filter((p) => p.hotelId === found?.hotelId));
      setCatering({ packages: cPkgRes.data || [], items: menuRes.data || [] });
    } catch (err) {
      setError(err.message || 'Failed to load this venue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live availability check whenever a date is picked.
  useEffect(() => {
    if (!form.date || !hall) {
      setAvailability(null);
      return undefined;
    }

    let cancelled = false;
    setChecking(true);

    hallsApi
      .checkHallAvailability(hall.id, form.date)
      .then((res) => {
        if (!cancelled) setAvailability(res.data?.available !== false);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.date, hall]);

  const images = useMemo(() => (hall ? galleryFor(hall, 3) : []), [hall]);

  const overCapacity = Number(form.guests) > Number(hall?.capacity || 0);

  const reserve = () => {
    const params = new URLSearchParams({ hallId: String(hall.id) });
    if (form.date) params.set('date', form.date);
    if (form.guests) params.set('guests', form.guests);
    if (form.packageId) params.set('packageId', form.packageId);
    navigate(`/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="container page">
        <LoadingText>Loading venue…</LoadingText>
      </div>
    );
  }

  if (error || !hall) {
    return (
      <div className="container page">
        <ErrorState message={error || 'Venue not found'} onRetry={load} />
        <p style={{ marginTop: 20 }}>
          <Link to="/halls" className="link-gold">
            ← Back to all venues
          </Link>
        </p>
      </div>
    );
  }

  const rating = hall.averageRating != null ? Number(hall.averageRating) : 0;

  const widget = (
    <div className="booking-widget">
      <div>
        <span className="booking-widget__price">{formatCurrency(hall.price)}</span>
        <p className="muted" style={{ fontSize: 13 }}>
          Hall hire, before packages and catering
        </p>
      </div>

      <label className="field">
        <span>Event date</span>
        <input
          type="date"
          min={todayIso()}
          value={form.date}
          onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
        />
      </label>

      {form.date && (
        <p style={{ fontSize: 13 }} className={availability === false ? '' : 'muted'}>
          {checking
            ? 'Checking availability…'
            : availability === true
              ? '✓ Available on this date'
              : availability === false
                ? 'Already booked — try another date'
                : 'Availability unknown'}
        </p>
      )}

      <label className="field">
        <span>Guests</span>
        <input
          type="number"
          min="1"
          max={hall.capacity}
          placeholder={`Up to ${hall.capacity}`}
          value={form.guests}
          onChange={(e) => setForm((prev) => ({ ...prev, guests: e.target.value }))}
        />
        {overCapacity && (
          <p className="field-error">This hall seats {formatNumber(hall.capacity)} guests.</p>
        )}
      </label>

      <label className="field">
        <span>Package</span>
        <select
          value={form.packageId}
          onChange={(e) => setForm((prev) => ({ ...prev, packageId: e.target.value }))}
        >
          <option value="">Choose later</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} — {formatCurrency(pkg.price)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={reserve}
        disabled={availability === false || overCapacity}
      >
        Reserve Now
      </button>

      <p className="muted" style={{ fontSize: 13 }}>
        No payment is taken until you confirm at the final step.
      </p>
    </div>
  );

  return (
    <div className="has-mobile-cta">
      <Carousel
        images={images}
        title={hall.name}
        subtitle={`${hotel?.name || hall.hotelName}${hotel?.location ? ` · ${hotel.location}` : ''}`}
      />

      <div className="container page">
        <div className="detail-layout">
          <div>
            <div className="row" style={{ marginBottom: 24 }}>
              <span className="badge badge--neutral">
                Up to {formatNumber(hall.capacity)} guests
              </span>
              {hall.decorationTheme && (
                <span className="badge badge--neutral">{hall.decorationTheme}</span>
              )}
              {rating > 0 && (
                <span className="badge badge--gold">
                  <StarIcon /> {rating.toFixed(1)}
                </span>
              )}
              {hotel?.location && (
                <span className="muted" style={{ fontSize: 14 }}>
                  <PinIcon style={{ verticalAlign: -2, marginRight: 4 }} />
                  {hotel.location}
                </span>
              )}
            </div>

            <Tabs
              tabs={[
                {
                  id: 'overview',
                  label: 'Overview',
                  render: () => (
                    <div className="stack" style={{ gap: 32 }}>
                      <div className="stack-sm">
                        <h2>About this hall</h2>
                        <p className="lead">
                          {hotel?.description ||
                            `${hall.name} at ${hall.hotelName} seats up to ${formatNumber(
                              hall.capacity
                            )} guests, styled around a ${
                              hall.decorationTheme || 'classic'
                            } theme.`}
                        </p>
                      </div>

                      <div className="spec-grid">
                        <div className="spec">
                          <span className="spec__label">Capacity</span>
                          <span className="spec__value">{formatNumber(hall.capacity)}</span>
                        </div>
                        <div className="spec">
                          <span className="spec__label">Hall hire</span>
                          <span className="spec__value">{formatCurrency(hall.price)}</span>
                        </div>
                        <div className="spec">
                          <span className="spec__label">Theme</span>
                          <span className="spec__value" style={{ fontSize: 18 }}>
                            {hall.decorationTheme || 'Flexible'}
                          </span>
                        </div>
                        <div className="spec">
                          <span className="spec__label">Rating</span>
                          <span className="spec__value">
                            {rating > 0 ? rating.toFixed(1) : 'New'}
                          </span>
                        </div>
                      </div>

                      <div className="stack-sm">
                        <h3>Facilities</h3>
                        <ul className="tick-list">
                          {FACILITIES.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {hotel?.contact && (
                        <div className="stack-sm">
                          <h3>Venue contact</h3>
                          <p className="muted">{hotel.contact}</p>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'packages',
                  label: 'Packages',
                  render: () =>
                    packages.length === 0 ? (
                      <EmptyState
                        title="No packages for this hotel yet"
                        message="You can still reserve the hall on its own and add a package later."
                        actionLabel="Browse all packages"
                        actionTo="/packages"
                      />
                    ) : (
                      <div className="package-grid">
                        {packages.map((pkg) => (
                          <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            actionLabel="Reserve with this package"
                            actionTo={`/book?hallId=${hall.id}&packageId=${pkg.id}`}
                          />
                        ))}
                      </div>
                    ),
                },
                {
                  id: 'catering',
                  label: 'Catering',
                  render: () =>
                    catering.packages.length === 0 && catering.items.length === 0 ? (
                      <EmptyState
                        title="Catering menus are being updated"
                        message="Speak to the coordinator for the current banquet menu."
                      />
                    ) : (
                      <div className="stack" style={{ gap: 32 }}>
                        {catering.packages.length > 0 && (
                          <div className="stack-sm">
                            <h3>Catering packages</h3>
                            <div className="menu-list">
                              {catering.packages.map((pkg) => (
                                <div className="menu-row" key={pkg.id}>
                                  <div className="menu-row__info">
                                    <span className="menu-row__name">{pkg.name}</span>
                                    <span className="menu-row__meta">
                                      {pkg.category}
                                      {pkg.vegetarian ? ' · Vegetarian' : ''}
                                    </span>
                                  </div>
                                  <span className="menu-row__meta">
                                    {formatCurrency(pkg.price)} / guest
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {catering.items.length > 0 && (
                          <div className="stack-sm">
                            <h3>À la carte dishes</h3>
                            <div className="menu-list">
                              {catering.items.slice(0, 8).map((item) => (
                                <div className="menu-row" key={item.id}>
                                  <div className="menu-row__info">
                                    <span className="menu-row__name">{item.name}</span>
                                    <span className="menu-row__meta">
                                      {item.category}
                                      {item.vegetarian ? ' · Vegetarian' : ''}
                                    </span>
                                  </div>
                                  <span className="menu-row__meta">
                                    {formatCurrency(item.price)} / guest
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p>
                              <Link to="/catering" className="link-gold">
                                See the full catering menu
                              </Link>
                            </p>
                          </div>
                        )}
                      </div>
                    ),
                },
                {
                  id: 'reviews',
                  label: 'Reviews',
                  render: () => (
                    <div className="stack" style={{ gap: 20 }}>
                      <div className="row">
                        <span className="badge badge--gold">
                          <StarIcon /> {rating > 0 ? rating.toFixed(1) : 'New'}
                        </span>
                        <span className="muted" style={{ fontSize: 14 }}>
                          Average rating recorded for this hall
                        </span>
                      </div>

                      {DEMO_REVIEWS.map((review) => (
                        <div className="panel" key={review.name}>
                          <div className="row" style={{ justifyContent: 'space-between' }}>
                            <strong style={{ fontWeight: 500 }}>{review.name}</strong>
                            <span className="badge badge--gold">
                              <StarIcon /> {review.rating}.0
                            </span>
                          </div>
                          <p className="muted" style={{ marginTop: 10 }}>
                            {review.text}
                          </p>
                        </div>
                      ))}

                      <p className="muted" style={{ fontSize: 13 }}>
                        Guest reviews are illustrative — a reviews API is not yet available.
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {widget}
        </div>
      </div>

      <div className="mobile-cta">
        <div className="mobile-cta__inner">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold-dark)' }}>
              {formatCurrency(hall.price)}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Hall hire
            </div>
          </div>
          <button type="button" className="btn btn--primary" onClick={reserve}>
            Reserve Now
          </button>
        </div>
      </div>
    </div>
  );
}
