import { AlertCircle, RefreshCw, SearchX } from 'lucide-react';

/** Spinner + message (used while "fetching" data). */
export function Loader({ label = 'Loading…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

/** Placeholder grid shown while the events list loads. */
export function CardSkeletons({ count = 6 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading events">
      {Array.from({ length: count }, (_, i) => (
        <div className="card skeleton-card" key={i}>
          <div className="skeleton skeleton--img" />
          <div className="skeleton-card__body">
            <div className="skeleton skeleton--line skeleton--w60" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--w80" />
            <div className="skeleton skeleton--btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = SearchX, title, message, action }) {
  return (
    <div className="state state--empty">
      <span className="state__icon">
        <Icon size={32} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon state__icon--error">
        <AlertCircle size={32} aria-hidden="true" />
      </span>
      <h3>Something went wrong</h3>
      <p>{message || 'We could not load the data. Please try again.'}</p>
      {onRetry && (
        <button className="btn btn--primary" onClick={onRetry}>
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </div>
  );
}
