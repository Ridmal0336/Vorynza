import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Calendar from '../../components/Calendar';
import FormError from '../../components/FormError';
import Tabs from '../../components/Tabs';
import { netPrice } from '../../components/PackageCard';
import { EmptyState, LoadingText } from '../../components/States';
import * as hallsApi from '../../api/halls';
import * as packagesApi from '../../api/packages';
import * as cateringApi from '../../api/catering';
import * as reservationsApi from '../../api/reservations';
import { formatCurrency, formatDate, formatNumber, titleCase, toIsoDate } from '../../utils/format';
import { coverFor } from '../../utils/images';

const STEPS = [
  { n: 1, title: 'Choose Date & Hall' },
  { n: 2, title: 'Add Package & Catering' },
  { n: 3, title: 'Review & Pay' },
];

const PAYMENT_METHODS = [
  { id: 'CARD', label: 'Credit / debit card', hint: 'Visa, Mastercard, Amex' },
  { id: 'BANK', label: 'Bank transfer', hint: 'Pay the deposit within 48 hours' },
];

export default function BookingPage() {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');

  const [halls, setHalls] = useState([]);
  const [packages, setPackages] = useState([]);
  const [cateringPackages, setCateringPackages] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({
    hallId: searchParams.get('hallId') || '',
    date: searchParams.get('date') || '',
    guests: searchParams.get('guests') || '',
    packageId: searchParams.get('packageId') || '',
    cateringPackageId: '',
    menuItemIds: [],
    paymentMethod: 'CARD',
    notes: '',
  });

  const [stepErrors, setStepErrors] = useState({});
  const [unavailable, setUnavailable] = useState(new Set());
  const [checkingDates, setCheckingDates] = useState(false);
  const availabilityCache = useRef(new Map());

  const [cateringEstimate, setCateringEstimate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitFieldErrors, setSubmitFieldErrors] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [hallRes, pkgRes, cPkgRes, menuRes] = await Promise.all([
          hallsApi.getHalls(),
          packagesApi.getPackages(),
          cateringApi.getCateringPackages().catch(() => ({ data: [] })),
          cateringApi.getMenuItems().catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setHalls(hallRes.data || []);
        setPackages(pkgRes.data || []);
        setCateringPackages(cPkgRes.data || []);
        setMenuItems(menuRes.data || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load booking options');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedHall = useMemo(
    () => halls.find((h) => String(h.id) === String(form.hallId)) || null,
    [halls, form.hallId]
  );

  const hallPackages = useMemo(() => {
    if (!selectedHall) return packages;
    const scoped = packages.filter((p) => p.hotelId === selectedHall.hotelId);
    return scoped.length > 0 ? scoped : packages;
  }, [packages, selectedHall]);

  const selectedPackage = useMemo(
    () => packages.find((p) => String(p.id) === String(form.packageId)) || null,
    [packages, form.packageId]
  );

  const selectedCateringPackage = useMemo(
    () => cateringPackages.find((p) => String(p.id) === String(form.cateringPackageId)) || null,
    [cateringPackages, form.cateringPackageId]
  );

  const menuCategories = useMemo(() => {
    const set = new Set();
    menuItems.forEach((item) => item.category && set.add(item.category));
    return [...set].sort();
  }, [menuItems]);

  /** Loads availability for every future day of the month shown in the calendar. */
  const loadMonthAvailability = useCallback(
    async ({ year, month }) => {
      if (!form.hallId) {
        setUnavailable(new Set());
        return;
      }

      const cacheKey = `${form.hallId}:${year}-${month}`;
      if (availabilityCache.current.has(cacheKey)) {
        setUnavailable(availabilityCache.current.get(cacheKey));
        return;
      }

      const today = toIsoDate(new Date());
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dates = [];
      for (let day = 1; day <= daysInMonth; day += 1) {
        const iso = toIsoDate(new Date(year, month, day));
        if (iso >= today) dates.push(iso);
      }

      setCheckingDates(true);
      try {
        const results = await Promise.all(
          dates.map((iso) =>
            hallsApi
              .checkHallAvailability(form.hallId, iso)
              .then((res) => ({ iso, available: res.data?.available !== false }))
              .catch(() => ({ iso, available: true }))
          )
        );
        const taken = new Set(results.filter((r) => !r.available).map((r) => r.iso));
        availabilityCache.current.set(cacheKey, taken);
        setUnavailable(taken);
      } finally {
        setCheckingDates(false);
      }
    },
    [form.hallId]
  );

  // Re-check the current month whenever the hall changes.
  const monthRef = useRef(null);
  useEffect(() => {
    if (monthRef.current) loadMonthAvailability(monthRef.current);
  }, [loadMonthAvailability]);

  // Live catering estimate from the real costing endpoint.
  useEffect(() => {
    const guests = Number(form.guests);
    if (!guests || guests < 1 || (!form.cateringPackageId && form.menuItemIds.length === 0)) {
      setCateringEstimate(null);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      cateringApi
        .estimateCost({
          cateringPackageId: form.cateringPackageId ? Number(form.cateringPackageId) : null,
          menuItemIds: form.menuItemIds,
          guestCount: guests,
        })
        .then((res) => {
          if (!cancelled) setCateringEstimate(res.data);
        })
        .catch(() => {
          if (!cancelled) setCateringEstimate(null);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.cateringPackageId, form.menuItemIds, form.guests]);

  const hallCost = Number(selectedHall?.price || 0);
  const packageCost = selectedPackage ? netPrice(selectedPackage) : 0;
  const cateringCost = Number(cateringEstimate?.totalCost || 0);
  const total = hallCost + packageCost + cateringCost;

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleMenuItem = (id) => {
    setForm((prev) => ({
      ...prev,
      menuItemIds: prev.menuItemIds.includes(id)
        ? prev.menuItemIds.filter((x) => x !== id)
        : [...prev.menuItemIds, id],
    }));
  };

  const validateStep = (target) => {
    const errors = {};
    if (target >= 2) {
      if (!form.hallId) errors.hallId = 'Choose a hall to continue';
      if (!form.date) errors.date = 'Pick an event date';
      if (!form.guests) errors.guests = 'Enter your guest count';
      else if (Number(form.guests) < 1) errors.guests = 'Guest count must be at least 1';
      else if (selectedHall && Number(form.guests) > Number(selectedHall.capacity)) {
        errors.guests = `${selectedHall.name} seats up to ${formatNumber(selectedHall.capacity)} guests`;
      }
    }
    if (target >= 3 && !form.packageId) {
      errors.packageId = 'Select a wedding package';
    }
    return errors;
  };

  const goTo = (target) => {
    if (target > step) {
      const errors = validateStep(target);
      setStepErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }
    setStepErrors({});
    setDirection(target > step ? 'forward' : 'back');
    setStep(target);
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    setSubmitError('');
    setSubmitFieldErrors(null);

    const errors = { ...validateStep(2), ...validateStep(3) };
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }

    // Catering choices and payment preference have no reservation columns, so they are
    // recorded in the notes field the API does persist.
    const cateringNote = [
      selectedCateringPackage ? `Catering package: ${selectedCateringPackage.name}` : null,
      form.menuItemIds.length > 0
        ? `Dishes: ${menuItems
            .filter((i) => form.menuItemIds.includes(i.id))
            .map((i) => i.name)
            .join(', ')}`
        : null,
      `Payment method: ${form.paymentMethod === 'CARD' ? 'Card' : 'Bank transfer'}`,
      form.notes.trim() || null,
    ]
      .filter(Boolean)
      .join(' | ');

    setSubmitting(true);
    try {
      const created = await reservationsApi.createReservation({
        userId: null,
        hallId: Number(form.hallId),
        packageId: Number(form.packageId),
        eventDate: form.date,
        guestCount: Number(form.guests),
        notes: cateringNote || null,
      });

      let details = created.data;
      try {
        const conf = await reservationsApi.getReservationConfirmation(created.data.id);
        details = { ...details, ...conf.data };
      } catch {
        // confirmation lookup is optional
      }
      setConfirmation(details);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(err.message || 'We could not complete your reservation');
      setSubmitFieldErrors(err.errors || null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container page">
        <LoadingText>Loading booking options…</LoadingText>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="container page">
        <div className="panel panel--alt" style={{ maxWidth: 680 }}>
          <p className="eyebrow">Reservation received</p>
          <h1 style={{ margin: '8px 0 12px' }}>Your date is held.</h1>
          <p className="lead">
            {confirmation.confirmationCode
              ? `Quote your confirmation code ${confirmation.confirmationCode} in any correspondence.`
              : 'Our coordinator will confirm your booking shortly.'}
          </p>

          <hr className="divider" />

          <div className="stack-sm">
            <div className="summary__row">
              <span>Hall</span>
              <strong>{confirmation.hallName || selectedHall?.name}</strong>
            </div>
            <div className="summary__row">
              <span>Package</span>
              <strong>{confirmation.packageName || selectedPackage?.name}</strong>
            </div>
            <div className="summary__row">
              <span>Event date</span>
              <strong>{formatDate(confirmation.eventDate || form.date)}</strong>
            </div>
            <div className="summary__row">
              <span>Guests</span>
              <strong>{formatNumber(confirmation.guestCount || form.guests)}</strong>
            </div>
            <div className="summary__row">
              <span>Status</span>
              <strong>{titleCase(confirmation.status || 'Pending')}</strong>
            </div>
          </div>

          <hr className="divider" />

          <p className="muted" style={{ fontSize: 14 }}>
            The hotel will issue your invoice against this reservation. You can track it under
            Payment History.
          </p>

          <div className="row" style={{ marginTop: 20 }}>
            <Link to="/dashboard/bookings" className="btn btn--primary">
              View my bookings
            </Link>
            <Link to="/halls" className="btn btn--secondary">
              Browse more venues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const summary = (
    <aside className="summary summary--sticky">
      <h3>Your booking</h3>

      <div className="summary__row">
        <span>Hall</span>
        <strong>{selectedHall?.name || 'Not selected'}</strong>
      </div>
      <div className="summary__row">
        <span>Date</span>
        <strong>{form.date ? formatDate(form.date) : 'Not selected'}</strong>
      </div>
      <div className="summary__row">
        <span>Guests</span>
        <strong>{form.guests || '—'}</strong>
      </div>
      <div className="summary__row">
        <span>Package</span>
        <strong>{selectedPackage?.name || 'Not selected'}</strong>
      </div>

      <hr className="divider" style={{ margin: 0 }} />

      <div className="summary__row">
        <span>Hall hire</span>
        <strong>{formatCurrency(hallCost)}</strong>
      </div>
      <div className="summary__row">
        <span>Wedding package</span>
        <strong>{formatCurrency(packageCost)}</strong>
      </div>
      <div className="summary__row">
        <span>Catering{form.guests ? ` (${form.guests} guests)` : ''}</span>
        <strong>{cateringCost > 0 ? formatCurrency(cateringCost) : '—'}</strong>
      </div>

      <div className="summary__total">
        <span className="label-text">Estimated total</span>
        <span className="summary__total-value">{formatCurrency(total)}</span>
      </div>
    </aside>
  );

  return (
    <div className="container page">
      <div className="page-head">
        <div className="page-head__text">
          <p className="eyebrow">Booking</p>
          <h1>Reserve your wedding day</h1>
        </div>
      </div>

      {loadError && <FormError message={loadError} />}

      <div className="stepper">
        <div className="stepper__track">
          <div
            className="stepper__fill"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <div className="stepper__labels">
          {STEPS.map((s) => (
            <div
              className={`stepper__label${s.n === step ? ' is-active' : ''}`}
              key={s.n}
              aria-current={s.n === step ? 'step' : undefined}
            >
              <small>Step {s.n}</small>
              {s.title}
            </div>
          ))}
        </div>
      </div>

      <div className="booking-layout">
        <div className="step-view">
          <div
            key={step}
            className={`step-pane${direction === 'back' ? ' step-pane--back' : ''}`}
          >
            {step === 1 && (
              <div className="stack" style={{ gap: 36 }}>
                <section>
                  <div className="section-head">
                    <h2>Choose a hall</h2>
                    <p className="muted">Availability is checked live for the hall you pick.</p>
                  </div>

                  {halls.length === 0 ? (
                    <EmptyState
                      title="No halls available"
                      message="No bookable halls are published right now."
                    />
                  ) : (
                    <div className="option-grid">
                      {halls.map((hall) => (
                        <button
                          type="button"
                          key={hall.id}
                          className={`option-card${
                            String(form.hallId) === String(hall.id) ? ' is-selected' : ''
                          }`}
                          onClick={() => {
                            update({ hallId: String(hall.id), date: '' });
                            setUnavailable(new Set());
                          }}
                        >
                          <span className="option-card__name">{hall.name}</span>
                          <span className="option-card__meta">
                            {hall.hotelName} · up to {formatNumber(hall.capacity)} guests
                          </span>
                          <span className="option-card__price">{formatCurrency(hall.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {stepErrors.hallId && <p className="field-error">{stepErrors.hallId}</p>}
                </section>

                <section>
                  <div className="section-head">
                    <h2>Pick your date</h2>
                    <p className="muted">
                      {form.hallId
                        ? 'Greyed dates are already booked for this hall.'
                        : 'Select a hall first to see which dates are open.'}
                    </p>
                  </div>

                  <Calendar
                    value={form.date}
                    onChange={(iso) => update({ date: iso })}
                    unavailable={unavailable}
                    checking={checkingDates}
                    onMonthChange={(cursor) => {
                      monthRef.current = cursor;
                      loadMonthAvailability(cursor);
                    }}
                  />
                  {stepErrors.date && <p className="field-error">{stepErrors.date}</p>}
                </section>

                <section style={{ maxWidth: 380 }}>
                  <label className="field">
                    <span>Guest count</span>
                    <input
                      type="number"
                      min="1"
                      max={selectedHall?.capacity || undefined}
                      placeholder={
                        selectedHall ? `Up to ${selectedHall.capacity}` : 'Number of guests'
                      }
                      value={form.guests}
                      onChange={(e) => update({ guests: e.target.value })}
                    />
                    {stepErrors.guests && <p className="field-error">{stepErrors.guests}</p>}
                  </label>
                </section>
              </div>
            )}

            {step === 2 && (
              <div className="stack" style={{ gap: 36 }}>
                <section>
                  <div className="section-head">
                    <h2>Wedding package</h2>
                    <p className="muted">
                      {selectedHall
                        ? `Packages offered by ${selectedHall.hotelName}.`
                        : 'Choose the bundle that fits your day.'}
                    </p>
                  </div>

                  {hallPackages.length === 0 ? (
                    <EmptyState
                      title="No packages published"
                      message="A coordinator can build a custom package for you after booking."
                    />
                  ) : (
                    <div className="option-grid">
                      {hallPackages.map((pkg) => (
                        <button
                          type="button"
                          key={pkg.id}
                          className={`option-card${
                            String(form.packageId) === String(pkg.id) ? ' is-selected' : ''
                          }`}
                          onClick={() => update({ packageId: String(pkg.id) })}
                        >
                          <span className="option-card__name">{pkg.name}</span>
                          <span className="option-card__meta">
                            {pkg.packageType || 'Package'} · {pkg.inclusions}
                          </span>
                          <span className="option-card__price">
                            {formatCurrency(netPrice(pkg))}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {stepErrors.packageId && <p className="field-error">{stepErrors.packageId}</p>}
                </section>

                {cateringPackages.length > 0 && (
                  <section>
                    <div className="section-head">
                      <h2>Catering package</h2>
                      <p className="muted">Priced per guest. Optional.</p>
                    </div>
                    <div className="option-grid">
                      {cateringPackages.map((pkg) => (
                        <button
                          type="button"
                          key={pkg.id}
                          className={`option-card${
                            String(form.cateringPackageId) === String(pkg.id) ? ' is-selected' : ''
                          }`}
                          onClick={() =>
                            update({
                              cateringPackageId:
                                String(form.cateringPackageId) === String(pkg.id)
                                  ? ''
                                  : String(pkg.id),
                            })
                          }
                        >
                          <span className="option-card__name">{pkg.name}</span>
                          <span className="option-card__meta">
                            {titleCase(pkg.category)}
                            {pkg.vegetarian ? ' · Vegetarian' : ''}
                          </span>
                          <span className="option-card__price">
                            {formatCurrency(pkg.price)} / guest
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {menuItems.length > 0 && (
                  <section>
                    <div className="section-head">
                      <h2>Add dishes</h2>
                      <p className="muted">
                        Toggle dishes to build your menu — the estimate updates as you go.
                      </p>
                    </div>

                    <Tabs
                      tabs={[
                        {
                          id: 'all',
                          label: 'All',
                          render: () => (
                            <MenuToggleList
                              items={menuItems}
                              selected={form.menuItemIds}
                              onToggle={toggleMenuItem}
                            />
                          ),
                        },
                        ...menuCategories.map((category) => ({
                          id: category,
                          label: titleCase(category),
                          render: () => (
                            <MenuToggleList
                              items={menuItems.filter((i) => i.category === category)}
                              selected={form.menuItemIds}
                              onToggle={toggleMenuItem}
                            />
                          ),
                        })),
                      ]}
                    />
                  </section>
                )}

                <section style={{ maxWidth: 560 }}>
                  <label className="field">
                    <span>Notes for the coordinator</span>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update({ notes: e.target.value })}
                      placeholder="Dietary requirements, timings, seating requests…"
                    />
                  </label>
                </section>
              </div>
            )}

            {step === 3 && (
              <div className="stack" style={{ gap: 36 }}>
                <section>
                  <div className="section-head">
                    <h2>Review your booking</h2>
                  </div>

                  <div className="card">
                    {selectedHall && (
                      <div className="card__media" style={{ aspectRatio: '16 / 7' }}>
                        <img src={coverFor(selectedHall, 1200)} alt={selectedHall.name} />
                      </div>
                    )}
                    <div className="card__body stack-sm">
                      <h3>{selectedHall?.name}</h3>
                      <p className="muted">
                        {selectedHall?.hotelName} · {formatDate(form.date)} · {form.guests} guests
                      </p>
                      <p className="muted">
                        {selectedPackage?.name}
                        {selectedCateringPackage ? ` + ${selectedCateringPackage.name}` : ''}
                        {form.menuItemIds.length > 0
                          ? ` + ${form.menuItemIds.length} dishes`
                          : ''}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="section-head">
                    <h2>Price breakdown</h2>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <tbody>
                        <tr>
                          <td>Hall hire — {selectedHall?.name}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(hallCost)}</td>
                        </tr>
                        <tr>
                          <td>Wedding package — {selectedPackage?.name}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(packageCost)}</td>
                        </tr>
                        {cateringEstimate && (
                          <>
                            <tr>
                              <td>
                                Catering package
                                {selectedCateringPackage ? ` — ${selectedCateringPackage.name}` : ''}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {formatCurrency(cateringEstimate.packageCost)}
                              </td>
                            </tr>
                            <tr>
                              <td>Dishes ({form.menuItemIds.length} selected)</td>
                              <td style={{ textAlign: 'right' }}>
                                {formatCurrency(cateringEstimate.menuItemsCost)}
                              </td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td>
                            <strong>Estimated total</strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong className="price" style={{ fontSize: 20 }}>
                              {formatCurrency(total)}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <div className="section-head">
                    <h2>Payment method</h2>
                  </div>
                  <div className="pay-methods">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        className={`pay-method${
                          form.paymentMethod === method.id ? ' is-selected' : ''
                        }`}
                        key={method.id}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={form.paymentMethod === method.id}
                          onChange={() => update({ paymentMethod: method.id })}
                        />
                        <span>
                          <strong style={{ fontWeight: 500 }}>{method.label}</strong>
                          <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                            {method.hint}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                    Your reservation is created as <strong>Pending</strong>. The hotel issues an
                    invoice and collects payment against it — no card is charged here.
                  </p>
                </section>

                {submitError && <FormError message={submitError} errors={submitFieldErrors} />}
                {Object.keys(stepErrors).length > 0 && (
                  <FormError message="Please review the earlier steps." errors={stepErrors} />
                )}
              </div>
            )}
          </div>

          <div className="booking-actions">
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => goTo(step - 1)}
              disabled={step === 1}
            >
              Back
            </button>

            {step < 3 ? (
              <button type="button" className="btn btn--primary" onClick={() => goTo(step + 1)}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? 'Confirming…' : 'Confirm & Pay'}
              </button>
            )}
          </div>
        </div>

        {summary}
      </div>
    </div>
  );
}

function MenuToggleList({ items, selected, onToggle }) {
  if (items.length === 0) {
    return <p className="muted">Nothing in this category yet.</p>;
  }

  return (
    <div className="menu-list">
      {items.map((item) => (
        <div className="menu-row" key={item.id}>
          <div className="menu-row__info">
            <span className="menu-row__name">{item.name}</span>
            <span className="menu-row__meta">
              {titleCase(item.category)}
              {item.vegetarian ? ' · Vegetarian' : ''}
            </span>
          </div>
          <div className="menu-row__right">
            <span className="menu-row__meta">{formatCurrency(item.price)} / guest</span>
            <button
              type="button"
              className={`switch${selected.includes(item.id) ? ' is-on' : ''}`}
              onClick={() => onToggle(item.id)}
              aria-pressed={selected.includes(item.id)}
              aria-label={`Toggle ${item.name}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
