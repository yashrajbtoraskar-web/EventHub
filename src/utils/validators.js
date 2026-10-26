export const CATEGORIES = ['Technology', 'Business', 'Design', 'Workshop'];
export const STATUSES = ['Upcoming', 'Ongoing', 'Completed'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^\p{L}[\p{L} .'-]*$/u;

/**
 * Validates the registration form. Returns an object of { field: message }.
 * An empty object means the data is valid.
 */
export function validateRegistration({ fullName, email, phone, eventId }) {
  const errors = {};

  const name = (fullName ?? '').trim();
  if (!name) errors.fullName = 'Full name is required.';
  else if (name.length < 3) errors.fullName = 'Name must be at least 3 characters.';
  else if (!NAME_RE.test(name)) errors.fullName = "Name can only contain letters, spaces, . ' and -.";

  const mail = (email ?? '').trim();
  if (!mail) errors.email = 'Email address is required.';
  else if (!EMAIL_RE.test(mail)) errors.email = 'Enter a valid email, e.g. name@example.com.';

  const phoneRaw = (phone ?? '').trim();
  const digits = phoneRaw.replace(/\D/g, '');
  if (!phoneRaw) errors.phone = 'Contact number is required.';
  else if (!/^\+?[\d\s-]+$/.test(phoneRaw)) errors.phone = 'Use digits only (spaces, - and a leading + are allowed).';
  else if (digits.length < 10 || digits.length > 13) errors.phone = 'Enter a valid number with 10 to 13 digits.';

  if (!eventId) errors.eventId = 'Please select an event.';

  return errors;
}

/** Validates the admin create / edit event form. */
export function validateEvent({ title, category, date, time, venue, totalSeats, image, description }) {
  const errors = {};

  const t = (title ?? '').trim();
  if (!t) errors.title = 'Title is required.';
  else if (t.length < 3) errors.title = 'Title must be at least 3 characters.';
  else if (t.length > 80) errors.title = 'Title must be 80 characters or fewer.';

  if (!CATEGORIES.includes(category)) errors.category = 'Choose a category.';
  if (!date) errors.date = 'Date is required.';
  if (!time) errors.time = 'Time is required.';
  if (!(venue ?? '').trim()) errors.venue = 'Venue is required.';

  const seats = Number(totalSeats);
  if (totalSeats === '' || totalSeats === null || totalSeats === undefined) errors.totalSeats = 'Total seats is required.';
  else if (!Number.isInteger(seats) || seats < 1) errors.totalSeats = 'Enter a whole number of at least 1.';
  else if (seats > 10000) errors.totalSeats = 'Maximum is 10,000 seats.';

  const img = (image ?? '').trim();
  if (img && !/^(https?:\/\/|\/|data:image\/)/i.test(img)) errors.image = 'Image must be a link starting with http:// or https://.';

  if ((description ?? '').length > 600) errors.description = 'Description must be 600 characters or fewer.';

  return errors;
}

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

/** Login form: only checks that fields are filled (the server decides if they are correct). */
export function validateLogin({ email, password }) {
  const errors = {};
  const mail = (email ?? '').trim();
  if (!mail) errors.email = 'Email address is required.';
  else if (!EMAIL_RE.test(mail)) errors.email = 'Enter a valid email, e.g. name@example.com.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

/** Candidate sign-up form. */
export function validateSignup({ fullName, email, phone, password, confirmPassword }) {
  const errors = validateRegistration({ fullName, email, phone, eventId: 'x' });
  delete errors.eventId;

  if (!password) errors.password = 'Password is required.';
  else if (!PASSWORD_RE.test(password)) errors.password = 'Use at least 6 characters with a letter and a number.';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}
