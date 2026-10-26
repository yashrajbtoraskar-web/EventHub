import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';
import { CATEGORIES, STATUSES, validateEvent } from '../utils/validators.js';
import { addDays } from '../utils/helpers.js';

function initialValues(event) {
  if (event) {
    return {
      title: event.title,
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue,
      image: event.image || '',
      description: event.description || '',
      totalSeats: String(event.totalSeats),
      status: event.status,
    };
  }
  return {
    title: '',
    category: 'Technology',
    date: addDays(7),
    time: '10:00',
    venue: '',
    image: '',
    description: '',
    totalSeats: '50',
    status: 'Upcoming',
  };
}

/** Create / edit form. `event` = null means "create". */
export default function EventFormModal({ event, onSubmit, onClose }) {
  const editing = !!event;
  const [values, setValues] = useState(() => initialValues(event));
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const clientErrors = validateEvent(values);
  const err = (f) => serverErrors[f] || (submitted ? clientErrors[f] : undefined);

  const set = (f) => (e) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    if (serverErrors[f]) setServerErrors((s) => ({ ...s, [f]: undefined }));
    setFormError('');
  };

  const props = (f) => ({
    id: `ev-${f}`,
    name: f,
    value: values[f],
    onChange: set(f),
    'aria-invalid': !!err(f),
    'aria-describedby': err(f) ? `ev-${f}-error` : undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(clientErrors).length) return;
    setSaving(true);
    setFormError('');
    try {
      await onSubmit(values);
    } catch (ex) {
      setServerErrors(ex.fields || {});
      setFormError(ex.message || 'Could not save the event.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Edit event' : 'Create new event'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="event-form" className="btn btn--primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={16} className="spin" /> Saving…
              </>
            ) : editing ? (
              'Save changes'
            ) : (
              'Create event'
            )}
          </button>
        </>
      }
    >
      <form id="event-form" className="form form--grid" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="alert alert--error form__full" role="alert">
            <AlertCircle size={20} />
            <span>{formError}</span>
          </div>
        )}

        <div className="form__full">
          <Field id="ev-title" label="Event title" required error={err('title')}>
            <input type="text" placeholder="e.g. React Workshop" maxLength={80} {...props('title')} />
          </Field>
        </div>

        <Field id="ev-category" label="Category" required error={err('category')}>
          <select {...props('category')}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field id="ev-status" label="Status" required>
          <select {...props('status')}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field id="ev-date" label="Date" required error={err('date')}>
          <input type="date" {...props('date')} />
        </Field>

        <Field id="ev-time" label="Time" required error={err('time')}>
          <input type="time" {...props('time')} />
        </Field>

        <Field id="ev-venue" label="Venue" required error={err('venue')}>
          <input type="text" placeholder="e.g. Community Hall, Pune" {...props('venue')} />
        </Field>

        <Field id="ev-totalSeats" label="Total seats" required error={err('totalSeats')}>
          <input type="number" min="1" max="10000" step="1" inputMode="numeric" {...props('totalSeats')} />
        </Field>

        <div className="form__full">
          <Field id="ev-image" label="Image URL" error={err('image')} hint="Optional – a default image is used for the category if left blank.">
            <input type="url" placeholder="https://…" {...props('image')} />
          </Field>
        </div>

        <div className="form__full">
          <Field id="ev-description" label="Description" error={err('description')}>
            <textarea rows={4} maxLength={600} placeholder="What will attendees learn or do?" {...props('description')} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
