/** Parse a YYYY-MM-DD string as a LOCAL date (avoids the UTC off-by-one bug). */
export function parseLocalDate(dateStr) {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return parseLocalDate(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Compare by date then time. */
export function compareEventDates(a, b) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export const IMAGES = {
  conference: unsplash('photo-1540575467063-178a50c2df87'),
  stage: unsplash('photo-1505373877841-8d25f7d46678'),
  workshop: unsplash('photo-1531482615713-2afd69097998'),
  meeting: unsplash('photo-1517048676732-d65bc937f952'),
  design: unsplash('photo-1558655146-d09347e92766'),
  code: unsplash('photo-1498050108023-c5249f4df085'),
  team: unsplash('photo-1552664730-d307ca884978'),
  students: unsplash('photo-1522202176988-66273c2fd55f'),
  analytics: unsplash('photo-1460925895917-afdab827c52f'),
};

/** Used when the admin leaves the image field blank. */
export const DEFAULT_IMAGE_BY_CATEGORY = {
  Technology: IMAGES.code,
  Business: IMAGES.meeting,
  Design: IMAGES.design,
  Workshop: IMAGES.workshop,
};

export function seatsLabel(event) {
  if (event.availableSeats <= 0) return 'Full';
  if (event.availableSeats === 1) return '1 seat left';
  return `${event.availableSeats} seats left`;
}

export function isRegistrationOpen(event) {
  return !!event && event.status === 'Upcoming' && event.availableSeats > 0;
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
