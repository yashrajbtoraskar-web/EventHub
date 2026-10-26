import { useCallback, useEffect, useRef, useState } from 'react';
import { getEvents } from '../services/eventService.js';

/**
 * Loads the events list and exposes loading / error state.
 * reload({ silent: true }) refreshes data without flashing the loader.
 */
export default function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getEvents();
      if (mounted.current) setEvents(data);
    } catch (err) {
      if (mounted.current) setError(err.message || 'Failed to load events.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { events, loading, error, reload: load };
}
