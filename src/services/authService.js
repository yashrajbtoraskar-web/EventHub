/**
 * Auth layer – Supabase Auth.
 * Session + profile (role) yahan se milta hai. UI guards ke liye getSession() cached value deta hai;
 * asli security RLS (database) mein hai.
 */
import { supabase } from '../lib/supabase.js';
import { ServiceError } from './errors.js';
import { validateLogin, validateSignup } from '../utils/validators.js';

// Demo ke liye: ye account pehle normal signup se banao, phir SQL se admin banao (schema.sql dekho)
export const DEMO_ADMIN = { email: 'admin@eventhub.com', password: 'Admin@123' };

let current = null; // cached session for sync UI checks

export const getSession = () => current;

async function buildSession(user) {
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', user.id)
    .maybeSingle();
  return {
    userId: user.id,
    email: user.email,
    fullName: data?.full_name || '',
    phone: data?.phone || '',
    role: data?.role || 'candidate',
  };
}

/** Auth state badalne par callback. Pehli baar (INITIAL_SESSION) bhi fire hota hai. */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    current = await buildSession(session?.user).catch(() => null);
    callback(current);
  });
  return () => data.subscription.unsubscribe();
}

export async function signup(input) {
  const errors = validateSignup(input);
  if (Object.keys(errors).length) throw new ServiceError('VALIDATION', 'Please fix the highlighted fields.', errors);

  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { full_name: input.fullName.trim().replace(/\s+/g, ' '), phone: input.phone.trim() } },
  });
  if (error) {
    if (/already registered/i.test(error.message)) {
      throw new ServiceError('DUPLICATE', 'An account with this email already exists. Please log in.', {
        email: 'This email is already registered.',
      });
    }
    throw new ServiceError('CONFLICT', error.message);
  }
  if (!data.session) {
    // Only if "Confirm email" is still ON in Supabase
    throw new ServiceError('AUTH', 'Account created. Please confirm your email, then log in.');
  }
  current = await buildSession(data.user);
  return current;
}

export async function login(input) {
  const errors = validateLogin(input);
  if (Object.keys(errors).length) throw new ServiceError('VALIDATION', 'Please fix the highlighted fields.', errors);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  // Same message for wrong email and wrong password
  if (error) throw new ServiceError('AUTH', 'Incorrect email or password.');
  current = await buildSession(data.user);
  return current;
}

export async function logout() {
  current = null;
  await supabase.auth.signOut();
}
