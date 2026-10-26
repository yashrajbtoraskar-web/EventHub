import useEvents from '../hooks/useEvents.js';
import RegistrationForm from '../components/RegistrationForm.jsx';
import { Loader, ErrorState } from '../components/Feedback.jsx';

/** Stand-alone registration page: the visitor picks the event from a dropdown. */
export default function RegisterPage() {
  const { events, loading, error, reload } = useEvents();

  return (
    <div className="container page page--narrow">
      <div className="card card--pad">
        <h1 className="page__title">Register for an event</h1>
        <p className="page__sub">Choose an event, fill in your details and we will reserve your seat.</p>
        {loading ? (
          <Loader label="Loading events…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => reload()} />
        ) : (
          <RegistrationForm events={events} onRegistered={() => reload({ silent: true })} />
        )}
      </div>
    </div>
  );
}
