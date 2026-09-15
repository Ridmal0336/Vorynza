import { Link } from 'react-router-dom';

export function EmptyState({ title, message, actionLabel, actionTo, onAction }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn--secondary btn--sm">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state">
      <h3>Something went wrong</h3>
      <p>{message || 'We could not load this content. Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingText({ children = 'Loading…' }) {
  return (
    <p className="muted" role="status">
      {children}
    </p>
  );
}

export function CardSkeletons({ count = 4 }) {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton" key={i}>
          <div className="skeleton__media" />
          <div className="skeleton__body">
            <div className="skeleton__line skeleton__line--mid" />
            <div className="skeleton__line skeleton__line--short" />
            <div className="skeleton__line" />
          </div>
        </div>
      ))}
    </div>
  );
}
