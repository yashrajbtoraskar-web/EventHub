import { useMemo, useState } from 'react';
import { CalendarX2, FilterX } from 'lucide-react';
import useEvents from '../hooks/useEvents.js';
import EventCard from '../components/EventCard.jsx';
import EventFilters from '../components/EventFilters.jsx';
import { CardSkeletons, EmptyState, ErrorState } from '../components/Feedback.jsx';
import { compareEventDates } from '../utils/helpers.js';

export default function EventsPage() {
  const { events, loading, error, reload } = useEvents();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('asc');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => (category === 'All' || e.category === category) && (!q || e.title.toLowerCase().includes(q)))
      .sort((a, b) => (sort === 'asc' ? compareEventDates(a, b) : compareEventDates(b, a)));
  }, [events, search, category, sort]);

  const filtersActive = search.trim() !== '' || category !== 'All';
  const clearFilters = () => {
    setSearch('');
    setCategory('All');
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Discover events &amp; workshops</h1>
          <p>Learn something new, meet people and grow your skills. Find an event, grab a seat and register in under a minute.</p>
        </div>
      </section>

      <div className="container page">
        <EventFilters
          search={search}
          onSearch={setSearch}
          category={category}
          onCategory={setCategory}
          sort={sort}
          onSort={setSort}
        />

        {loading ? (
          <CardSkeletons />
        ) : error ? (
          <ErrorState message={error} onRetry={() => reload()} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={events.length === 0 ? CalendarX2 : undefined}
            title={events.length === 0 ? 'No events yet' : 'No events found'}
            message={
              events.length === 0
                ? 'Events will show up here once an admin creates them.'
                : 'Nothing matches your search or filters. Try a different keyword or category.'
            }
            action={
              filtersActive && (
                <button className="btn btn--ghost" onClick={clearFilters}>
                  <FilterX size={16} /> Clear filters
                </button>
              )
            }
          />
        ) : (
          <>
            <p className="result-count" aria-live="polite">
              Showing {visible.length} of {events.length} event{events.length === 1 ? '' : 's'}
            </p>
            <div className="grid">
              {visible.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
