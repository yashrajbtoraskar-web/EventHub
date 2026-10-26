import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarClock,
  Users,
  CheckCheck,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  RotateCcw,
  CalendarX2,
} from 'lucide-react';
import useEvents from '../hooks/useEvents.js';
import EventImage from '../components/EventImage.jsx';
import EventFormModal from '../components/EventFormModal.jsx';
import EventViewModal from '../components/EventViewModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { EmptyState, ErrorState } from '../components/Feedback.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createEvent, updateEvent, updateEventStatus, deleteEvent, resetData } from '../services/eventService.js';
import { STATUSES } from '../utils/validators.js';
import { compareEventDates, formatDate, formatTime } from '../utils/helpers.js';

function StatCard({ icon: Icon, label, value, tone, loading }) {
  return (
    <div className={`stat stat--${tone}`}>
      <span className="stat__icon">
        <Icon size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="stat__label">{label}</p>
        <p className="stat__value">{loading ? <span className="skeleton skeleton--stat" /> : value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const { events, loading, error, reload } = useEvents();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // modal state
  const [formFor, setFormFor] = useState(undefined); // undefined = closed, null = create, object = edit
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);

  const stats = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((e) => e.status === 'Upcoming').length,
      registrations: events.reduce((sum, e) => sum + e.registeredCount, 0),
      completed: events.filter((e) => e.status === 'Completed').length,
    }),
    [events],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => (statusFilter === 'All' || e.status === statusFilter) && (!q || e.title.toLowerCase().includes(q)))
      .sort(compareEventDates);
  }, [events, search, statusFilter]);

  const handleSave = async (values) => {
    const editing = !!formFor;
    if (editing) await updateEvent(formFor.id, values);
    else await createEvent(values);
    await reload({ silent: true }); // refresh the table first so it is already up to date
    setFormFor(undefined);
    toast.success(editing ? 'Event updated successfully.' : 'Event created successfully.');
  };

  const handleStatus = async (event, status) => {
    if (status === event.status) return;
    setStatusBusyId(event.id);
    try {
      await updateEventStatus(event.id, status);
      await reload({ silent: true });
      toast.success(`"${event.title}" marked as ${status}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteEvent(deleting.id);
      await reload({ silent: true });
      toast.success(`"${deleting.title}" was deleted.`);
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      await resetData();
      await reload({ silent: true });
      toast.success('Sample data restored.');
      setConfirmReset(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Admin dashboard</h1>
          <p className="page__sub">Manage events and monitor registrations.</p>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reset sample data
          </button>
          <button className="btn btn--primary" onClick={() => setFormFor(null)}>
            <Plus size={18} /> Create event
          </button>
        </div>
      </div>

      <section className="stats" aria-label="Summary">
        <StatCard icon={CalendarDays} label="Total Events" value={stats.total} tone="indigo" loading={loading} />
        <StatCard icon={CalendarClock} label="Upcoming Events" value={stats.upcoming} tone="blue" loading={loading} />
        <StatCard icon={Users} label="Total Registrations" value={stats.registrations} tone="green" loading={loading} />
        <StatCard icon={CheckCheck} label="Completed Events" value={stats.completed} tone="amber" loading={loading} />
      </section>

      <section className="card card--pad">
        <div className="toolbar">
          <h2>Manage events</h2>
          <div className="toolbar__controls">
            <div className="search search--sm">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search events…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search events"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="select-sm">
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-rows" aria-busy="true" aria-label="Loading events">
            {Array.from({ length: 5 }, (_, i) => (
              <div className="skeleton skeleton--row" key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => reload()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={events.length === 0 ? 'No events yet' : 'No matching events'}
            message={events.length === 0 ? 'Create your first event to get started.' : 'Try a different search or status filter.'}
            action={
              events.length === 0 && (
                <button className="btn btn--primary" onClick={() => setFormFor(null)}>
                  <Plus size={16} /> Create event
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date &amp; time</th>
                  <th>Registrations</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event) => {
                  const pct = Math.min(100, Math.round((event.registeredCount / event.totalSeats) * 100));
                  return (
                    <tr key={event.id}>
                      <td data-label="Event">
                        <div className="cell-event">
                          <EventImage src={event.image} alt="" className="cell-event__img" />
                          <div>
                            <strong>{event.title}</strong>
                            <span className="muted">
                              {event.category} · {event.venue}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Date & time">
                        {formatDate(event.date)}
                        <span className="muted">{formatTime(event.time)}</span>
                      </td>
                      <td data-label="Registrations">
                        <strong>
                          {event.registeredCount}
                          <span className="muted-inline"> / {event.totalSeats}</span>
                        </strong>
                        <div className="progress progress--sm" aria-hidden="true">
                          <span className={event.availableSeats === 0 ? 'progress__bar progress__bar--full' : 'progress__bar'} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td data-label="Status">
                        <select
                          className={`status-select status-select--${event.status.toLowerCase()}`}
                          value={event.status}
                          disabled={statusBusyId === event.id}
                          onChange={(e) => handleStatus(event, e.target.value)}
                          aria-label={`Status for ${event.title}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Actions">
                        <div className="row-actions">
                          <button className="icon-btn" onClick={() => setViewing(event)} aria-label={`View ${event.title}`} title="View">
                            <Eye size={18} />
                          </button>
                          <button className="icon-btn" onClick={() => setFormFor(event)} aria-label={`Edit ${event.title}`} title="Edit">
                            <Pencil size={18} />
                          </button>
                          <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(event)} aria-label={`Delete ${event.title}`} title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formFor !== undefined && (
        <EventFormModal event={formFor} onSubmit={handleSave} onClose={() => setFormFor(undefined)} />
      )}

      {viewing && <EventViewModal event={viewing} onClose={() => setViewing(null)} />}

      {deleting && (
        <ConfirmModal
          title="Delete event?"
          danger
          busy={busy}
          confirmLabel="Delete event"
          message={
            <>
              <p>
                Are you sure you want to delete <strong>{deleting.title}</strong>?
              </p>
              <p className="muted">
                This also removes its {deleting.registeredCount} registration{deleting.registeredCount === 1 ? '' : 's'} and cannot be undone.
              </p>
            </>
          }
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {confirmReset && (
        <ConfirmModal
          title="Reset sample data?"
          busy={busy}
          confirmLabel="Reset data"
          message="This replaces all events and registrations with the original sample data. Any changes you made will be lost."
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
