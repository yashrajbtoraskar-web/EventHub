import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Pencil, Ticket, Trash2 } from 'lucide-react';
import EventImage from '../components/EventImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Field from '../components/Field.jsx';
import { EmptyState, ErrorState, Loader } from '../components/Feedback.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { cancelRegistration, getMyRegistrations, updateMyRegistration } from '../services/eventService.js';
import { validateRegistration } from '../utils/validators.js';
import { formatDate, formatTime } from '../utils/helpers.js';

/** Small dialog to edit the name / contact number of one registration (the "U" in CRUD). */
function EditRegistrationModal({ registration, onClose, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState({ fullName: registration.fullName, phone: registration.phone });
  const [serverErrors, setServerErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const clientErrors = validateRegistration({ ...values, email: registration.email, eventId: registration.eventId });
  const errorFor = (f) => serverErrors[f] || (submitted ? clientErrors[f] : undefined);
  const set = (f) => (e) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    setServerErrors((s) => ({ ...s, [f]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (clientErrors.fullName || clientErrors.phone) return;
    setBusy(true);
    try {
      await updateMyRegistration(registration.id, values);
      toast.success('Registration updated.');
      onSaved();
    } catch (err) {
      if (err.fields) setServerErrors(err.fields);
      toast.error(err.message || 'Could not update the registration.');
      if (err.code !== 'VALIDATION') onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Edit registration"
      onClose={onClose}
      busy={busy}
      size="sm"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn--primary" form="edit-reg-form" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="edit-reg-form" className="form" onSubmit={save} noValidate>
        <p className="muted-text">
          {registration.event.title} · registered with <strong>{registration.email}</strong>
        </p>
        <Field id="edit-name" label="Full name" required error={errorFor('fullName')}>
          <input id="edit-name" value={values.fullName} onChange={set('fullName')} aria-invalid={!!errorFor('fullName')} />
        </Field>
        <Field id="edit-phone" label="Contact number" required error={errorFor('phone')}>
          <input id="edit-phone" type="tel" value={values.phone} onChange={set('phone')} aria-invalid={!!errorFor('phone')} />
        </Field>
      </form>
    </Modal>
  );
}

export default function MyRegistrationsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setItems(await getMyRegistrations());
    } catch (err) {
      setError(err.message || 'Could not load your registrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmCancel = async () => {
    setBusy(true);
    try {
      await cancelRegistration(cancelling.id);
      toast.success(`Registration for "${cancelling.event.title}" cancelled. Your seat was released.`);
    } catch (err) {
      toast.error(err.message || 'Could not cancel the registration.');
    } finally {
      setBusy(false);
      setCancelling(null);
      load({ silent: true });
    }
  };

  let content;
  if (loading) content = <Loader label="Loading your registrations…" />;
  else if (error) content = <ErrorState message={error} onRetry={() => load()} />;
  else if (!items.length) {
    content = (
      <EmptyState
        icon={Ticket}
        title="No registrations yet"
        message="Browse events and reserve your first seat."
        action={
          <Link to="/" className="btn btn--primary">
            Browse events
          </Link>
        }
      />
    );
  } else {
    content = (
      <ul className="reg-list">
        {items.map((r) => {
          const open = r.event.status === 'Upcoming';
          return (
            <li key={r.id} className="reg-item card">
              <EventImage src={r.event.image} alt={r.event.title} className="reg-item__img" />
              <div className="reg-item__body">
                <div className="view__badges">
                  <span className="badge badge--category badge--static">{r.event.category}</span>
                  <StatusBadge status={r.event.status} />
                </div>
                <h3>{r.event.title}</h3>
                <ul className="meta">
                  <li><CalendarDays size={16} /> {formatDate(r.event.date)}</li>
                  <li><Clock size={16} /> {formatTime(r.event.time)}</li>
                  <li><MapPin size={16} /> {r.event.venue}</li>
                </ul>
                <p className="muted-text">
                  {r.fullName} · {r.email} · {r.phone}
                </p>
              </div>
              <div className="reg-item__actions">
                <button className="btn btn--ghost btn--sm" onClick={() => setEditing(r)} disabled={!open}>
                  <Pencil size={15} /> Edit
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => setCancelling(r)} disabled={!open}>
                  <Trash2 size={15} /> Cancel
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="container page">
      <div className="page__head">
        <div>
          <h1 className="page__title">My registrations</h1>
          <p className="page__sub">View, edit or cancel the events you have registered for.</p>
        </div>
      </div>
      {content}

      {editing && (
        <EditRegistrationModal
          registration={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load({ silent: true });
          }}
        />
      )}
      {cancelling && (
        <ConfirmModal
          title="Cancel registration?"
          danger
          busy={busy}
          confirmLabel="Yes, cancel"
          message={<p>Your seat for <strong>{cancelling.event.title}</strong> will be released.</p>}
          onConfirm={confirmCancel}
          onCancel={() => setCancelling(null)}
        />
      )}
    </div>
  );
}
