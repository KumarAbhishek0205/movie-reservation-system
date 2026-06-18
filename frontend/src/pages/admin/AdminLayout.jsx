import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/movies', label: 'Movies' },
  { to: '/admin/rooms', label: 'Rooms' },
  { to: '/admin/showtimes', label: 'Showtimes' },
  { to: '/admin/reservations', label: 'Reservations' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen pt-16">
      <aside className="hidden w-56 shrink-0 border-r border-line bg-surface px-4 py-8 md:block">
        <p className="mb-6 px-2 font-mono text-xs uppercase tracking-widest2 text-ink-faint">
          Admin
        </p>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-accent-muted text-white' : 'text-ink-dim hover:bg-surface2 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
