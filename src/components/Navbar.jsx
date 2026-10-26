import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, LogIn, LogOut, Menu, Ticket, UserPlus, X, Home, ListChecks } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { session, isAdmin, isCandidate, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Links change with the role: guests / candidates / admin see different menus.
  const links = [
    { to: '/', label: 'Events', icon: Home, end: true },
    ...(isCandidate
      ? [
          { to: '/register', label: 'Register', icon: Ticket },
          { to: '/my-registrations', label: 'My Registrations', icon: ListChecks },
        ]
      : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard }] : []),
  ];

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    toast.info('You have been logged out.');
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand__logo">
            <CalendarDays size={20} />
          </span>
          EventHub
        </Link>

        <button
          className="icon-btn navbar__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`navbar__links ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `navlink ${isActive ? 'navlink--active' : ''}`}
              onClick={close}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}

          <span className="navbar__spacer" />

          {session ? (
            <>
              <span className="userchip" title={session.email}>
                <span className="userchip__name">{session.fullName}</span>
                <span className={`userchip__role userchip__role--${session.role}`}>{session.role}</span>
              </span>
              <button className="navlink navlink--btn" onClick={handleLogout}>
                <LogOut size={18} aria-hidden="true" /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `navlink ${isActive ? 'navlink--active' : ''}`} onClick={close}>
                <LogIn size={18} aria-hidden="true" /> Login
              </NavLink>
              <NavLink to="/signup" className="btn btn--primary btn--sm navbar__cta" onClick={close}>
                <UserPlus size={16} aria-hidden="true" /> Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
