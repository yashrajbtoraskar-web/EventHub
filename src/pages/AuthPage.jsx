import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Info, Loader2, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_ADMIN } from '../services/authService.js';
import { validateLogin, validateSignup } from '../utils/validators.js';

const EMPTY = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };

function PasswordInput({ id, name, value, onChange, onBlur, invalid, describedBy, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="input-wrap__btn"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/** One component for both /login and /signup (mode = 'login' | 'signup'). */
export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { session, login, signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const notice = location.state?.notice;

  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = useMemo(() => (isSignup ? validateSignup(values) : validateLogin(values)), [isSignup, values]);
  const errorFor = (f) => serverErrors[f] || (touched[f] || submitted ? clientErrors[f] : undefined);

  // Already logged in -> nothing to do here.
  if (session) return <Navigate to={session.role === 'admin' ? '/admin' : '/'} replace />;

  const set = (f) => (e) => {
    const v = e.target.value;
    setValues((s) => ({ ...s, [f]: v }));
    setBanner('');
    if (serverErrors[f]) setServerErrors((s) => ({ ...s, [f]: undefined }));
  };
  const blur = (f) => () => setTouched((t) => ({ ...t, [f]: true }));

  const aria = (f, id) => ({ invalid: !!errorFor(f), describedBy: errorFor(f) ? `${id}-error` : undefined });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    setBanner('');
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      const s = await (isSignup ? signup(values) : login(values));
      toast.success(isSignup ? `Account created. Welcome, ${s.fullName}!` : `Welcome back, ${s.fullName}!`);
      navigate(s.role === 'admin' ? '/admin' : from && from !== '/admin' ? from : '/', { replace: true });
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) setServerErrors(err.fields);
      setBanner(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillAdmin = () => {
    setValues((s) => ({ ...s, ...DEMO_ADMIN }));
    setServerErrors({});
    setBanner('');
  };

  return (
    <div className="container page page--narrow">
      <div className="card card--pad auth">
        <h1 className="page__title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="page__sub">
          {isSignup
            ? 'Sign up as a candidate to register for events and manage your registrations.'
            : 'Log in as a candidate or as an admin.'}
        </p>

        {notice && !banner && (
          <div className="alert alert--warning" role="status">
            <Info size={20} />
            <span>{notice}</span>
          </div>
        )}
        {banner && (
          <div className="alert alert--error" role="alert">
            <AlertCircle size={20} />
            <span>{banner}</span>
          </div>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate aria-label={isSignup ? 'Sign up form' : 'Login form'}>
          {isSignup && (
            <>
              <Field id="auth-name" label="Full name" required error={errorFor('fullName')}>
                <input
                  id="auth-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Aarav Sharma"
                  value={values.fullName}
                  onChange={set('fullName')}
                  onBlur={blur('fullName')}
                  aria-invalid={!!errorFor('fullName')}
                  aria-describedby={errorFor('fullName') ? 'auth-name-error' : undefined}
                />
              </Field>
              <Field id="auth-phone" label="Contact number" required error={errorFor('phone')} hint="10 to 13 digits">
                <input
                  id="auth-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  value={values.phone}
                  onChange={set('phone')}
                  onBlur={blur('phone')}
                  aria-invalid={!!errorFor('phone')}
                  aria-describedby={errorFor('phone') ? 'auth-phone-error' : undefined}
                />
              </Field>
            </>
          )}

          <Field id="auth-email" label="Email address" required error={errorFor('email')}>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={set('email')}
              onBlur={blur('email')}
              aria-invalid={!!errorFor('email')}
              aria-describedby={errorFor('email') ? 'auth-email-error' : undefined}
            />
          </Field>

          <Field
            id="auth-password"
            label="Password"
            required
            error={errorFor('password')}
            hint={isSignup ? 'At least 6 characters, with a letter and a number.' : undefined}
          >
            <PasswordInput
              id="auth-password"
              name="password"
              value={values.password}
              onChange={set('password')}
              onBlur={blur('password')}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="Your password"
              {...aria('password', 'auth-password')}
            />
          </Field>

          {isSignup && (
            <Field id="auth-confirm" label="Confirm password" required error={errorFor('confirmPassword')}>
              <PasswordInput
                id="auth-confirm"
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={set('confirmPassword')}
                onBlur={blur('confirmPassword')}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                {...aria('confirmPassword', 'auth-confirm')}
              />
            </Field>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="spin" /> {isSignup ? 'Creating account…' : 'Logging in…'}
              </>
            ) : isSignup ? (
              <>
                <UserPlus size={18} /> Create account
              </>
            ) : (
              <>
                <LogIn size={18} /> Log in
              </>
            )}
          </button>
        </form>

        <p className="auth__switch">
          {isSignup ? (
            <>
              Already have an account? <Link to="/login" state={location.state}>Log in</Link>
            </>
          ) : (
            <>
              New here? <Link to="/signup" state={location.state}>Create a candidate account</Link>
            </>
          )}
        </p>

        {!isSignup && (
          <div className="demo-box">
            <p>
              <ShieldCheck size={16} /> <strong>Demo admin login</strong>
            </p>
            <p className="demo-box__creds">
              {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
            </p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={fillAdmin}>
              Fill admin credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
