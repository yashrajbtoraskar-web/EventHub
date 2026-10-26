/**
 * Data layer – Supabase (Postgres).
 * Components sirf yahin se data lete hain. Function names aur return shape wahi hain,
 * isliye UI mein koi change nahi.
 */
import { supabase } from '../lib/supabase.js';
import { validateEvent, validateRegistration } from '../utils/validators.js';
import { DEFAULT_IMAGE_BY_CATEGORY } from '../utils/helpers.js';
import { ServiceError } from './errors.js';
import { getSession } from './authService.js';

export { ServiceError };

/* ---------- access checks (UI ke liye; asli check RLS karta hai) ---------- */

function requireLogin() {
  const session = getSession();
  if (!session) throw new ServiceError('UNAUTHENTICATED', 'Please log in to continue.');
  return session;
}
function requireAdmin() {
  const session = requireLogin();
  if (session.role !== 'admin') throw new ServiceError('FORBIDDEN', 'Only an admin can do this.');
  return session;
}
function requireCandidate() {
  const session = requireLogin();
  if (session.role !== 'candidate') {
    throw new ServiceError('FORBIDDEN', 'Admin accounts cannot register for events. Use a candidate account.');
  }
  return session;
}

/* ---------- error mapping ---------- */

const MESSAGES = {
  DUPLICATE: 'This email is already registered for this event.',
  FULL: 'Sorry, this event is full. No seats are left.',
  CLOSED: 'Registration is closed for this event.',
  NOT_FOUND: 'This item could not be found. It may have been deleted.',
  UNAUTHENTICATED: 'Please log in to continue.',
  FORBIDDEN: 'You are not allowed to do this.',
};

function fail(error) {
  const msg = error?.message || '';
  if (/row-level security/i.test(msg)) throw new ServiceError('FORBIDDEN', MESSAGES.FORBIDDEN);
  const code = Object.keys(MESSAGES).find((c) => msg.includes(c));
  if (code) {
    const fields = code === 'DUPLICATE' ? { email: MESSAGES.DUPLICATE } : {};
    throw new ServiceError(code, MESSAGES[code], fields);
  }
  throw new ServiceError('CONFLICT', msg || 'Something went wrong. Please try again.');
}

/* ---------- mappers: DB row (snake_case) -> UI object (camelCase) ---------- */

const toEvent = (r) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  date: r.date,
  time: (r.time || '').slice(0, 5),
  venue: r.venue,
  image: r.image || DEFAULT_IMAGE_BY_CATEGORY[r.category] || null,
  description: r.description || '',
  status: r.status,
  totalSeats: r.total_seats,
  registeredCount: r.registered_count ?? 0,
  availableSeats: Math.max(r.total_seats - (r.registered_count ?? 0), 0),
});

const toRegistration = (r) => ({
  id: r.id,
  eventId: r.event_id,
  userId: r.user_id,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  createdAt: r.created_at,
});

const toEventRow = (input) => {
  const category = input.category;
  return {
    title: input.title.trim(),
    category,
    date: input.date,
    time: input.time,
    venue: input.venue.trim(),
    image: (input.image || '').trim() || DEFAULT_IMAGE_BY_CATEGORY[category] || null,
    description: (input.description || '').trim(),
    total_seats: Number(input.totalSeats),
    status: input.status || 'Upcoming',
  };
};

/* ---------- events ---------- */

export async function getEvents() {
  const { data, error } = await supabase
    .from('events_with_counts')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  if (error) fail(error);
  return data.map(toEvent);
}

export async function getEventById(id) {
  const { data, error } = await supabase
    .from('events_with_counts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) fail(error);
  if (!data) throw new ServiceError('NOT_FOUND', MESSAGES.NOT_FOUND);
  return toEvent(data);
}

export async function createEvent(input) {
  requireAdmin();
  const errors = validateEvent(input);
  if (Object.keys(errors).length) throw new ServiceError('VALIDATION', 'Please fix the highlighted fields.', errors);

  const { data, error } = await supabase.from('events').insert(toEventRow(input)).select().single();
  if (error) fail(error);
  return toEvent(data);
}

export async function updateEvent(id, input) {
  requireAdmin();
  const errors = validateEvent(input);
  if (Object.keys(errors).length) throw new ServiceError('VALIDATION', 'Please fix the highlighted fields.', errors);

  const current = await getEventById(id);
  if (Number(input.totalSeats) < current.registeredCount) {
    throw new ServiceError(
      'CONFLICT',
      `${current.registeredCount} people have already registered, so total seats cannot be lower than ${current.registeredCount}.`,
      { totalSeats: `Cannot be lower than the ${current.registeredCount} existing registrations.` },
    );
  }

  const row = toEventRow({ ...input, status: input.status || current.status });
  const { data, error } = await supabase.from('events').update(row).eq('id', id).select().single();
  if (error) fail(error);
  return toEvent({ ...data, registered_count: current.registeredCount });
}

export async function updateEventStatus(id, status) {
  requireAdmin();
  const { data, error } = await supabase.from('events').update({ status }).eq('id', id).select().single();
  if (error) fail(error);
  return toEvent({ ...data, registered_count: (await getEventById(id)).registeredCount });
}

export async function deleteEvent(id) {
  requireAdmin();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) fail(error);
  return { id }; // registrations cascade-delete via foreign key
}

/* ---------- registrations ---------- */

export async function getRegistrations(eventId) {
  requireAdmin();
  let query = supabase
    .from('registrations')
    .select('*, event:events(title)')
    .order('created_at', { ascending: false });
  if (eventId) query = query.eq('event_id', eventId);
  const { data, error } = await query;
  if (error) fail(error);
  return data.map((r) => ({ ...toRegistration(r), eventTitle: r.event?.title || '' }));
}

/** Seat booking RPC mein lock ke saath hoti hai (race-safe). */
export async function registerForEvent(input) {
  requireCandidate();
  const errors = validateRegistration(input);
  if (Object.keys(errors).length) throw new ServiceError('VALIDATION', 'Please fix the highlighted fields.', errors);

  const { data, error } = await supabase.rpc('register_for_event', {
    p_event: input.eventId,
    p_name: input.fullName.trim().replace(/\s+/g, ' '),
    p_email: input.email.trim(),
    p_phone: input.phone.trim(),
  });
  if (error) fail(error);
  const event = await getEventById(input.eventId);
  return { registration: toRegistration(data), event };
}

/* ---------- candidate: my registrations ---------- */

export async function getMyRegistrations() {
  const session = requireCandidate();
  const { data, error } = await supabase
    .from('registrations')
    .select('*, event:events(*)')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false });
  if (error) fail(error);
  return data
    .filter((r) => r.event)
    .map((r) => ({ ...toRegistration(r), event: toEvent(r.event) }));
}

/** Registration ka owner check + event abhi Upcoming hai ya nahi. */
async function ownedOpenRegistration(id, action) {
  const session = requireCandidate();
  const { data, error } = await supabase
    .from('registrations')
    .select('*, event:events(status)')
    .eq('id', id)
    .maybeSingle();
  if (error) fail(error);
  if (!data || data.user_id !== session.userId) {
    throw new ServiceError('NOT_FOUND', 'This registration could not be found.');
  }
  if (data.event && data.event.status !== 'Upcoming') {
    throw new ServiceError('CLOSED', `You can no longer ${action} this registration because the event is ${data.event.status.toLowerCase()}.`);
  }
  return data;
}

export async function updateMyRegistration(id, input) {
  const reg = await ownedOpenRegistration(id, 'edit');
  const errors = validateRegistration({ fullName: input.fullName, phone: input.phone, email: reg.email, eventId: reg.event_id });
  delete errors.email;
  if (Object.keys(errors).length) throw new ServiceError('VALIDATION', 'Please fix the highlighted fields.', errors);

  const { data, error } = await supabase
    .from('registrations')
    .update({ full_name: input.fullName.trim().replace(/\s+/g, ' '), phone: input.phone.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) fail(error);
  return toRegistration(data);
}

/** Cancel karne se seat apne aap free ho jati hai (seats derived hain). */
export async function cancelRegistration(id) {
  await ownedOpenRegistration(id, 'cancel');
  const { error } = await supabase.from('registrations').delete().eq('id', id);
  if (error) fail(error);
  return { id };
}

/* ---------- utilities ---------- */

async function countOf(query) {
  const { count, error } = await query;
  if (error) fail(error);
  return count ?? 0;
}

export async function getStats() {
  requireAdmin();
  const events = () => supabase.from('events').select('*', { count: 'exact', head: true });
  const [totalEvents, upcomingEvents, completedEvents, totalRegistrations] = await Promise.all([
    countOf(events()),
    countOf(events().eq('status', 'Upcoming')),
    countOf(events().eq('status', 'Completed')),
    countOf(supabase.from('registrations').select('*', { count: 'exact', head: true })),
  ]);
  return { totalEvents, upcomingEvents, totalRegistrations, completedEvents };
}

/** Demo data reset Supabase mein allowed nahi hai; SQL Editor se data manually badlo. */
export async function resetData() {
  requireAdmin();
  throw new ServiceError('FORBIDDEN', 'Reset is not available with the live database. Use the SQL Editor to reset data.');
}
