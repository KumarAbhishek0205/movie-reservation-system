import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${isActive ? 'text-white' : 'text-ink-dim hover:text-white'}`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-colors duration-300 md:px-12 ${
        scrolled ? 'bg-canvas/95 backdrop-blur border-b border-line' : 'bg-gradient-to-b from-canvas/90 to-transparent'
      }`}
    >
      <div className="flex items-center gap-8">
        <Link to="/" className="font-display text-2xl tracking-wide text-accent">
          CINEVAULT
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={linkClass} end>
            Browse
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/reservations" className={linkClass}>
              My Tickets
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <span className="hidden text-sm text-ink-dim sm:inline">Hi, {user.name?.split(' ')[0]}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded border border-line px-4 py-1.5 text-sm font-medium text-white transition hover:border-ink-dim"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded px-4 py-1.5 text-sm font-medium text-white hover:bg-surface2"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
