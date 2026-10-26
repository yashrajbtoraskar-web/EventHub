import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, CalendarX2, LogIn, ShieldAlert } from 'lucide-react';
import useEvents from '../hooks/useEvents.js';
import EventImage from '../components/EventImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import { Loader, EmptyState, ErrorState } from '../components/Feedback.jsx';
import { formatDate, formatTime, seatsLabel } from '../utils/helpers.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function EventDetailsPage() {
  const { id } = useParams();
  const { session, isCandidate } = useAuth();
  const { events, loading, error, reload } = useEvents();
  const event = events.find((e) => e.id === id);

  let content;
  if (loading) {
    content = <Loader label="Loading event…" />;
  } else if (error) {
    content = <ErrorState message={error} onRetry={() => reload()} />;
  } else if (!event) {
    content = (
      <EmptyState
        icon={CalendarX2}
        title="Event not found"
        message="This event doesn't exist or has been removed."
        action={
          <Link to="/" className="btn btn--primary">
            Browse all events
          </Link>
        }
      />
    );
  } else {
    const pct = Math.min(100, Math.round((event.registeredCount / event.totalSeats) * 100));
    const full = event.availableSeats <= 0;
    content = (
      <div className="details">
        <article className="details__main card">
          <EventImage src={event.image} alt={event.title} className="details__img" />
          <div className="details__content">
            <div className="view__badges">
              <span className="badge badge--category badge--static">{event.category}</span>
              <StatusBadge status={event.status} />
            </div>
            <h1>{event.title}</h1>

            <ul className="meta meta--grid">
              <li><CalendarDays size={18} /> {formatDate(event.date)}</li>
              <li><Clock size={18} /> {formatTime(event.time)}</li>
              <li><MapPin size={18} /> {event.venue}</li>
              <li>
                <Users size={18} /> {event.registeredCount} registered of {event.totalSeats}
              </li>
            </ul>

            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Seats filled">
              <span style={{ width: `${pct}%` }} className={full ? 'progress__bar progress__bar--full' : 'progress__bar'} />
            </div>
            <p className={`seats-note ${full ? 'seats-note--full' : ''}`}>{seatsLabel(event)}</p>

            <h2>About this event</h2>
            <p className="details__desc">{event.description || 'No description provided.'}</p>
          </div>
        </article>

        <aside className="details__side card" aria-label="Register for this event">
          <h2>Reserve your seat</h2>
          {isCandidate ? (
            <RegistrationForm events={events} defaultEventId={event.id} onRegistered={() => reload({ silent: true })} />
          ) : session ? (
            <div className="alert alert--warning" role="status">
              <ShieldAlert size={20} />
              <span>You are logged in as an admin. Admin accounts cannot register for events.</span>
            </div>
          ) : (
            <div className="login-gate">
              <p>Please log in or create a candidate account to register for this event.</p>
              <Link to="/login" state={{ from: `/events/${event.id}`, notice: 'Log in to register for this event.' }} className="btn btn--primary btn--block">
                <LogIn size={18} /> Log in to register
              </Link>
              <Link to="/signup" state={{ from: `/events/${event.id}` }} className="btn btn--ghost btn--block">
                Create an account
              </Link>
            </div>
          )}
        </aside>
      </div>
    );
  }

  return (
    <div className="container page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Back to events
      </Link>
      {content}
    </div>
  );
}
