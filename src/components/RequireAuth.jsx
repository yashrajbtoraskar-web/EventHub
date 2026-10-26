import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState } from './Feedback.jsx';

/**
 * Route guard.
 *  - not logged in            -> redirect to /login (remembers where the user wanted to go)
 *  - logged in, wrong role    -> "access denied" screen
 * NOTE: this only protects the UI. The real checks are inside the service layer.
 */
export default function RequireAuth({ role, children }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname, notice: 'Please log in to continue.' }} />;
  }

  if (role && session.role !== role) {
    return (
      <div className="container page">
        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          message={
            role === 'admin'
              ? 'This area is only for administrators.'
              : 'This area is only for candidate accounts. Admin accounts cannot register for events.'
          }
          action={
            <Link to="/" className="btn btn--primary">
              Back to events
            </Link>
          }
        />
      </div>
    );
  }

  return children;
}
