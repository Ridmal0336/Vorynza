import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../../components/Modal';
import PackageCard, { netPrice } from '../../components/PackageCard';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/States';
import { useAuth } from '../../context/AuthContext';
import * as packagesApi from '../../api/packages';
import { formatCurrency, splitList } from '../../utils/format';

const MAX_COMPARE = 3;

export default function PackagesPage() {
  const { isAdmin } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('price-asc');
  const [compare, setCompare] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await packagesApi.getPackages();
      setPackages(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const types = useMemo(() => {
    const set = new Set();
    packages.forEach((pkg) => pkg.packageType && set.add(pkg.packageType));
    return [...set].sort();
  }, [packages]);

  const visible = useMemo(() => {
    const list = packages.filter((pkg) => !type || pkg.packageType === type);
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => netPrice(a) - netPrice(b));
    if (sort === 'price-desc') sorted.sort((a, b) => netPrice(b) - netPrice(a));
    if (sort === 'name') sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return sorted;
  }, [packages, type, sort]);

  const toggleCompare = (pkg) => {
    setCompare((prev) => {
      if (prev.some((p) => p.id === pkg.id)) return prev.filter((p) => p.id !== pkg.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, pkg];
    });
  };

  const compareRows = useMemo(
    () => [
      { label: 'Hotel', get: (pkg) => pkg.hotelName || '—' },
      { label: 'Type', get: (pkg) => pkg.packageType || '—' },
      { label: 'List price', get: (pkg) => formatCurrency(pkg.price) },
      {
        label: 'Discount',
        get: (pkg) =>
          Number(pkg.discountPercent) > 0 ? `${Number(pkg.discountPercent)}% off` : 'None',
      },
      { label: 'You pay', get: (pkg) => formatCurrency(netPrice(pkg)) },
      {
        label: 'Inclusions',
        get: (pkg) => {
          const items = splitList(pkg.inclusions);
          return items.length === 0 ? (
            '—'
          ) : (
            <ul className="tick-list">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="container page">
      <div className="page-head">
        <div className="page-head__text">
          <p className="eyebrow">Packages</p>
          <h1>Wedding packages</h1>
          <p className="lead">
            Each package bundles the hall, décor, and dining for a fixed price. Compare up to three
            side by side, then reserve your date.
          </p>
        </div>

        {isAdmin && (
          <Link to="/admin/packages" className="btn btn--quiet btn--sm">
            Manage packages
          </Link>
        )}
      </div>

      {!loading && !error && packages.length > 0 && (
        <div className="table-toolbar">
          <div className="row">
            <label className="field">
              <span>Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
          <span className="muted" style={{ fontSize: 14 }}>
            {visible.length} {visible.length === 1 ? 'package' : 'packages'}
          </span>
        </div>
      )}

      {loading ? (
        <CardSkeletons count={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No packages available"
          message="Nothing is published for this filter yet. Try another type or browse our venues."
          actionLabel="Browse venues"
          actionTo="/halls"
        />
      ) : (
        <div className="package-grid">
          {visible.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              actionTo={`/book?packageId=${pkg.id}`}
              onCompareToggle={toggleCompare}
              compareChecked={compare.some((p) => p.id === pkg.id)}
              compareDisabled={compare.length >= MAX_COMPARE}
            />
          ))}
        </div>
      )}

      {compare.length > 0 && (
        <div className="compare-bar">
          <div className="compare-bar__inner">
            <span>
              {compare.length} selected — {compare.map((p) => p.name).join(', ')}
            </span>
            <div className="row">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setShowCompare(true)}
                disabled={compare.length < 2}
              >
                Compare {compare.length < 2 ? '(pick 2)' : ''}
              </button>
              <button
                type="button"
                className="btn btn--on-dark btn--sm"
                onClick={() => setCompare([])}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompare && (
        <Modal title="Compare packages" onClose={() => setShowCompare(false)} wide>
          <div className="table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-table__row-label" />
                  {compare.map((pkg) => (
                    <th key={pkg.id}>{pkg.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="compare-table__row-label">
                      {row.label}
                    </th>
                    {compare.map((pkg) => (
                      <td key={pkg.id}>{row.get(pkg)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="compare-table__row-label" />
                  {compare.map((pkg) => (
                    <td key={pkg.id}>
                      <Link to={`/book?packageId=${pkg.id}`} className="btn btn--primary btn--sm">
                        Select Package
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
