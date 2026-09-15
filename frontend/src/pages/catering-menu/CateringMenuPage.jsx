import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FormError from '../../components/FormError';
import Tabs from '../../components/Tabs';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import { useAuth } from '../../context/AuthContext';
import * as cateringApi from '../../api/catering';
import { formatCurrency, titleCase } from '../../utils/format';

export default function CateringMenuPage() {
  const { isAdmin } = useAuth();
  const [packages, setPackages] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [estimate, setEstimate] = useState({ cateringPackageId: '', guestCount: '150', ids: [] });
  const [result, setResult] = useState(null);
  const [estimateError, setEstimateError] = useState('');
  const [estimating, setEstimating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgRes, itemRes] = await Promise.all([
        cateringApi.getCateringPackages(),
        cateringApi.getMenuItems(),
      ]);
      setPackages(pkgRes.data || []);
      setItems(itemRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load catering menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => item.category && set.add(item.category));
    return [...set].sort();
  }, [items]);

  const toggleItem = (id) => {
    setResult(null);
    setEstimate((prev) => ({
      ...prev,
      ids: prev.ids.includes(id) ? prev.ids.filter((x) => x !== id) : [...prev.ids, id],
    }));
  };

  const runEstimate = async (e) => {
    e.preventDefault();
    setEstimateError('');
    setResult(null);

    const guests = Number(estimate.guestCount);
    if (!guests || guests < 1) {
      setEstimateError('Enter a guest count of at least 1');
      return;
    }

    setEstimating(true);
    try {
      const res = await cateringApi.estimateCost({
        cateringPackageId: estimate.cateringPackageId ? Number(estimate.cateringPackageId) : null,
        menuItemIds: estimate.ids,
        guestCount: guests,
      });
      setResult(res.data);
    } catch (err) {
      setEstimateError(err.message || 'Could not calculate an estimate');
    } finally {
      setEstimating(false);
    }
  };

  const renderItems = (list) =>
    list.length === 0 ? (
      <EmptyState title="Nothing on this menu yet" message="Check back soon." />
    ) : (
      <div className="menu-list">
        {list.map((item) => (
          <div className="menu-row" key={item.id}>
            <div className="menu-row__info">
              <span className="menu-row__name">{item.name}</span>
              <span className="menu-row__meta">
                {titleCase(item.category)}
                {item.vegetarian ? ' · Vegetarian' : ''}
                {item.description ? ` · ${item.description}` : ''}
              </span>
            </div>
            <div className="menu-row__right">
              <span className="menu-row__meta">{formatCurrency(item.price)} / guest</span>
              <button
                type="button"
                className={`switch${estimate.ids.includes(item.id) ? ' is-on' : ''}`}
                onClick={() => toggleItem(item.id)}
                aria-pressed={estimate.ids.includes(item.id)}
                aria-label={`Add ${item.name} to estimate`}
              />
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="container page">
      <div className="page-head">
        <div className="page-head__text">
          <p className="eyebrow">Catering</p>
          <h1>Banquet menus & costing</h1>
          <p className="lead">
            Browse per-guest catering packages and individual dishes, then estimate your total
            before you book.
          </p>
        </div>

        {isAdmin && (
          <Link to="/admin/catering" className="btn btn--quiet btn--sm">
            Manage catering
          </Link>
        )}
      </div>

      {loading ? (
        <LoadingText>Loading menus…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="search-layout">
          <div>
            {packages.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <div className="section-head">
                  <h2>Catering packages</h2>
                  <p className="muted">Priced per guest, served buffet style.</p>
                </div>
                <div className="option-grid">
                  {packages.map((pkg) => (
                    <button
                      type="button"
                      key={pkg.id}
                      className={`option-card${
                        String(estimate.cateringPackageId) === String(pkg.id) ? ' is-selected' : ''
                      }`}
                      onClick={() => {
                        setResult(null);
                        setEstimate((prev) => ({
                          ...prev,
                          cateringPackageId:
                            String(prev.cateringPackageId) === String(pkg.id) ? '' : String(pkg.id),
                        }));
                      }}
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

            <section>
              <div className="section-head">
                <h2>À la carte dishes</h2>
                <p className="muted">Toggle dishes to add them to your estimate.</p>
              </div>

              {items.length === 0 ? (
                <EmptyState
                  title="No dishes published yet"
                  message="Our banquet menus are being updated."
                />
              ) : (
                <Tabs
                  tabs={[
                    { id: 'all', label: 'All', render: () => renderItems(items) },
                    ...categories.map((category) => ({
                      id: category,
                      label: titleCase(category),
                      render: () => renderItems(items.filter((i) => i.category === category)),
                    })),
                  ]}
                />
              )}
            </section>
          </div>

          <form className="summary summary--sticky" onSubmit={runEstimate} noValidate>
            <h3>Cost estimate</h3>

            <label className="field">
              <span>Guest count</span>
              <input
                type="number"
                min="1"
                value={estimate.guestCount}
                onChange={(e) => {
                  setResult(null);
                  setEstimate((prev) => ({ ...prev, guestCount: e.target.value }));
                }}
              />
            </label>

            <div className="summary__row">
              <span>Catering package</span>
              <strong>
                {packages.find((p) => String(p.id) === String(estimate.cateringPackageId))?.name ||
                  'None'}
              </strong>
            </div>
            <div className="summary__row">
              <span>Dishes selected</span>
              <strong>{estimate.ids.length}</strong>
            </div>

            {estimateError && <FormError message={estimateError} />}

            {result && (
              <>
                <div className="summary__row">
                  <span>Package cost</span>
                  <strong>{formatCurrency(result.packageCost)}</strong>
                </div>
                <div className="summary__row">
                  <span>Dishes cost</span>
                  <strong>{formatCurrency(result.menuItemsCost)}</strong>
                </div>
                <div className="summary__total">
                  <span className="label-text">Total</span>
                  <span className="summary__total-value">{formatCurrency(result.totalCost)}</span>
                </div>
                {result.lineItems?.length > 0 && (
                  <ul className="tick-list" style={{ fontSize: 13 }}>
                    {result.lineItems.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </>
            )}

            <button type="submit" className="btn btn--primary btn--block" disabled={estimating}>
              {estimating ? 'Calculating…' : 'Calculate estimate'}
            </button>

            <Link to="/book" className="btn btn--secondary btn--block">
              Start a booking
            </Link>
          </form>
        </div>
      )}
    </div>
  );
}
