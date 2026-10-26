import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Send, Loader2, Ban } from 'lucide-react';
import Field from './Field.jsx';
import { registerForEvent } from '../services/eventService.js';
import { validateRegistration } from '../utils/validators.js';
import { formatDate, formatTime, isRegistrationOpen, seatsLabel } from '../utils/helpers.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';


export default function RegistrationForm({ events, defaultEventId = '', onRegistered }) {
  const toast = useToast();
  const { session } = useAuth();
  // The logged-in candidate's details are pre-filled (still editable).
  const PROFILE = { fullName: session?.fullName ?? '', email: session?.email ?? '', phone: session?.phone ?? '' };
  const formRef = useRef(null);
  const [values, setValues] = useState({ ...PROFILE, eventId: defaultEventId });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', message }
  const [submitting, setSubmitting] = useState(false);

  // If the route changes to another event, follow it.
  useEffect(() => {
    setValues((v) => ({ ...v, eventId: defaultEventId }));
    setBanner(null);
    setServerErrors({});
  }, [defaultEventId]);

  const selected = events.find((e) => e.id === values.eventId);
  const open = isRegistrationOpen(selected);
  const clientErrors = useMemo(() => validateRegistration(values), [values]);

  const errorFor = (field) => {
    if (serverErrors[field]) return serverErrors[field];
    return touched[field] || submitted ? clientErrors[field] : undefined;
  };

  const set = (field) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    setBanner(null);
    if (serverErrors[field] || (field === 'eventId' && serverErrors.email)) {
      setServerErrors((s) => ({ ...s, [field]: undefined, ...(field === 'eventId' ? { email: undefined } : {}) }));
    }
  };

  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    setBanner(null);

    const errs = validateRegistration(values);
    if (Object.keys(errs).length) {
      const firstField = ['fullName', 'email', 'phone', 'eventId'].find((f) => errs[f]);
      formRef.current?.querySelector(`[name="${firstField}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { event } = await registerForEvent(values);
      const message = `You're registered for "${event.title}" on ${formatDate(event.date)} at ${formatTime(event.time)}. ${seatsLabel(event)}.`;
      setBanner({ type: 'success', message });
      toast.success('Registration successful!');
      setValues((v) => ({ ...PROFILE, eventId: v.eventId }));
      setTouched({});
      setSubmitted(false);
      setServerErrors({});
      onRegistered?.();
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) setServerErrors(err.fields);
      setBanner({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
      toast.error(err.message || 'Registration failed.');
      // Seat info may be stale (e.g. someone else took the last seat).
      if (err.code === 'FULL' || err.code === 'CLOSED' || err.code === 'NOT_FOUND') onRegistered?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate ref={formRef} aria-label="Event registration form">
      {banner && (
        <div className={`alert alert--${banner.type}`} role={banner.type === 'error' ? 'alert' : 'status'}>
          {banner.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{banner.message}</span>
        </div>
      )}

      <Field id="reg-event" label="Select event" required error={errorFor('eventId')}
        hint={selected ? `${selected.category} · ${seatsLabel(selected)}` : undefined}>
        <select
          id="reg-event"
          name="eventId"
          value={values.eventId}
          onChange={set('eventId')}
          onBlur={blur('eventId')}
          aria-invalid={!!errorFor('eventId')}
          aria-describedby={errorFor('eventId') ? 'reg-event-error' : undefined}
        >
          <option value="">Choose an event…</option>
          {events.map((ev) => {
            const evOpen = isRegistrationOpen(ev);
            const note = ev.status !== 'Upcoming' ? ev.status : ev.availableSeats <= 0 ? 'Full' : `${ev.availableSeats} seats left`;
            return (
              <option key={ev.id} value={ev.id} disabled={!evOpen && ev.id !== values.eventId}>
                {ev.title} — {formatDate(ev.date)} ({note})
              </option>
            );
          })}
        </select>
      </Field>

      {selected && !open && (
        <div className="alert alert--warning" role="status">
          <Ban size={20} />
          <span>
            {selected.status !== 'Upcoming'
              ? `Registration is closed – this event is ${selected.status.toLowerCase()}.`
              : 'This event is full. Please choose another event.'}
          </span>
        </div>
      )}

      <Field id="reg-name" label="Full name" required error={errorFor('fullName')}>
        <input
          id="reg-name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="e.g. Aarav Sharma"
          value={values.fullName}
          onChange={set('fullName')}
          onBlur={blur('fullName')}
          aria-invalid={!!errorFor('fullName')}
          aria-describedby={errorFor('fullName') ? 'reg-name-error' : undefined}
        />
      </Field>

      <Field id="reg-email" label="Email address" required error={errorFor('email')}>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={set('email')}
          onBlur={blur('email')}
          aria-invalid={!!errorFor('email')}
          aria-describedby={errorFor('email') ? 'reg-email-error' : undefined}
        />
      </Field>

      <Field id="reg-phone" label="Contact number" required error={errorFor('phone')} hint="10 to 13 digits, e.g. 9876543210 or +91 98765 43210">
        <input
          id="reg-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="9876543210"
          value={values.phone}
          onChange={set('phone')}
          onBlur={blur('phone')}
          aria-invalid={!!errorFor('phone')}
          aria-describedby={errorFor('phone') ? 'reg-phone-error' : undefined}
        />
      </Field>

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting || (!!selected && !open)}>
        {submitting ? (
          <>
            <Loader2 size={18} className="spin" /> Registering…
          </>
        ) : (
          <>
            <Send size={18} /> Register now
          </>
        )}
      </button>
    </form>
  );
}
