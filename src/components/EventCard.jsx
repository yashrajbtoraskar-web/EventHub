import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import EventImage from './EventImage.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatTime, seatsLabel } from '../utils/helpers.js';

export default function EventCard({ event }) {
  const full = event.availableSeats <= 0;
  const low = !full && event.availableSeats <= 5;

  return (
    <article className="card event-card">
      <div className="event-card__media">
        <EventImage src={event.image} alt={event.title} />
        <span className="badge badge--category">{event.category}</span>
        <StatusBadge status={event.status} />
      </div>

      <div className="event-card__body">
        <h3 className="event-card__title">{event.title}</h3>

        <ul className="meta">
          <li>
            <CalendarDays size={16} aria-hidden="true" />
            <span>{formatDate(event.date)}</span>
          </li>
          <li>
            <Clock size={16} aria-hidden="true" />
            <span>{formatTime(event.time)}</span>
          </li>
          <li>
            <MapPin size={16} aria-hidden="true" />
            <span>{event.venue}</span>
          </li>
        </ul>

        <div className="event-card__footer">
          <span className={`seats ${full ? 'seats--full' : low ? 'seats--low' : ''}`}>
            <Users size={16} aria-hidden="true" />
            {seatsLabel(event)}
            {!full && <small>of {event.totalSeats}</small>}
          </span>
          <Link to={`/events/${event.id}`} className="btn btn--primary btn--sm">
            View Details <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
