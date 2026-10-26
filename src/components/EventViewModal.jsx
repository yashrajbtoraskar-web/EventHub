import { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import Modal from './Modal.jsx';
import EventImage from './EventImage.jsx';
import StatusBadge from './StatusBadge.jsx';
import { Loader, EmptyState, ErrorState } from './Feedback.jsx';
import { getRegistrations } from '../services/eventService.js';
import { formatDate, formatTime } from '../utils/helpers.js';

/** Admin "View" dialog: full event details plus the list of registrants. */
export default function EventViewModal({ event, onClose }) {
  const [regs, setRegs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getRegistrations(event.id)
      .then((list) => !cancelled && setRegs(list))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  return (
    <Modal title="Event details" onClose={onClose} size="lg">
      <div className="view">
        <EventImage src={event.image} alt={event.title} className="view__img" />
        <div className="view__head">
          <h3>{event.title}</h3>
          <div className="view__badges">
            <span className="badge badge--category badge--static">{event.category}</span>
            <StatusBadge status={event.status} />
          </div>
        </div>

        <ul className="meta meta--grid">
          <li><CalendarDays size={16} /> {formatDate(event.date)}</li>
          <li><Clock size={16} /> {formatTime(event.time)}</li>
          <li><MapPin size={16} /> {event.venue}</li>
          <li><Users size={16} /> {event.registeredCount} / {event.totalSeats} registered ({event.availableSeats} left)</li>
        </ul>

        {event.description && <p className="view__desc">{event.description}</p>}

        <h4 className="view__sub">Registrations ({event.registeredCount})</h4>
        {error ? (
          <ErrorState message={error} />
        ) : !regs ? (
          <Loader label="Loading registrations…" />
        ) : regs.length === 0 ? (
          <EmptyState icon={Users} title="No registrations yet" message="Registrations will appear here as people sign up." />
        ) : (
          <div className="table-wrap table-wrap--scroll">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fullName}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td>{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
