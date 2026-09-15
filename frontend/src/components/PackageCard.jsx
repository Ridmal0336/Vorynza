import { Link } from 'react-router-dom';
import { formatCurrency, splitList } from '../utils/format';

/** Net price after the stored discount percentage, if any. */
export function netPrice(pkg) {
  const price = Number(pkg?.price ?? 0);
  const discount = Number(pkg?.discountPercent ?? 0);
  if (!discount) return price;
  return price - (price * discount) / 100;
}

export default function PackageCard({
  pkg,
  selected,
  onCompareToggle,
  compareChecked,
  compareDisabled,
  actionLabel = 'Select Package',
  actionTo,
  onAction,
}) {
  const inclusions = splitList(pkg.inclusions);
  const discounted = Number(pkg.discountPercent ?? 0) > 0;

  return (
    <article className={`package-card${selected ? ' is-selected' : ''}`}>
      <div className="package-card__body">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <p className="eyebrow">{pkg.packageType || 'Package'}</p>
          {pkg.featured && <span className="badge badge--gold">Featured</span>}
        </div>

        <h3 style={{ fontSize: 24 }}>{pkg.name}</h3>

        <div className="package-card__price">
          {formatCurrency(netPrice(pkg))}
          {discounted && (
            <small>
              <span className="strike">{formatCurrency(pkg.price)}</span> · {Number(pkg.discountPercent)}% off
            </small>
          )}
          {!discounted && <small>{pkg.hotelName || 'All inclusive'}</small>}
        </div>

        {pkg.description && (
          <p className="muted" style={{ fontSize: 15 }}>
            {pkg.description}
          </p>
        )}

        {inclusions.length > 0 && (
          <ul className="tick-list">
            {inclusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="package-card__foot">
        {actionTo ? (
          <Link to={actionTo} className="btn btn--primary btn--block">
            {actionLabel}
          </Link>
        ) : (
          <button type="button" className="btn btn--primary btn--block" onClick={onAction}>
            {actionLabel}
          </button>
        )}

        {onCompareToggle && (
          <label className="check" style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              checked={Boolean(compareChecked)}
              disabled={!compareChecked && compareDisabled}
              onChange={() => onCompareToggle(pkg)}
            />
            Compare
          </label>
        )}
      </div>
    </article>
  );
}
