import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/Feedback.jsx';

export default function NotFoundPage() {
  return (
    <div className="container page">
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="The page you are looking for does not exist."
        action={
          <Link to="/" className="btn btn--primary">
            Go to events
          </Link>
        }
      />
    </div>
  );
}
