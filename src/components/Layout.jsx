import { NavLink, Link, Outlet } from 'react-router';
import { Award, Briefcase, CalendarDays, LayoutDashboard, MessagesSquare, Moon, Repeat, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { dueTopics } from '../lib/revision.js';
import { todayStr } from '../lib/dates.js';

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true },
  { to: '/revise', label: 'Revise', short: 'Revise', icon: Repeat },
  { to: '/planner', label: 'Planner', short: 'Planner', icon: CalendarDays },
  { to: '/interviews', label: 'Interviews', short: 'Interviews', icon: Briefcase },
  { to: '/wall', label: 'Experience wall', short: 'Wall', icon: MessagesSquare },
  { to: '/badges', label: 'Badges', short: 'Badges', icon: Award },
];

export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <rect width="24" height="24" rx="7" fill="var(--accent)" />
        <path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Placera
    </span>
  );
}

export function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button type="button" className="icon-btn" onClick={onToggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function Layout({ theme, onToggleTheme }) {
  const { profile } = useAuth();
  const { topics, loading, loadError, reload } = useData();
  const due = dueTopics(topics, todayStr()).length;

  const links = (mobile) =>
    NAV.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
          <Icon size={mobile ? 20 : 18} />
          <span>{mobile ? item.short : item.label}</span>
          {item.to === '/revise' && due > 0 && <span className="nav-count">{due}</span>}
        </NavLink>
      );
    });

  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" className="side-logo">
          <Logo />
        </Link>
        <nav className="side-nav" aria-label="Main">
          {links(false)}
        </nav>
        <Link to="/about" className="side-foot">
          About Placera
        </Link>
      </aside>

      <div className="main">
        <header className="top">
          <Link to="/" className="top-logo">
            <Logo />
          </Link>
          <div className="top-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Link to="/profile" className="me">
              <span className="avatar">
                {profile?.username ? profile.username[0].toUpperCase() : <UserRound size={16} />}
              </span>
              <span className="me-name">{profile?.username || 'Profile'}</span>
            </Link>
          </div>
        </header>

        <main className="page">
          {loading ? (
            <p className="muted">Loading your data…</p>
          ) : loadError ? (
            <div className="notice notice-error">
              <p>Couldn't load your data. {loadError}</p>
              <button type="button" className="btn" onClick={reload}>
                Try again
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <nav className="tabs" aria-label="Main">
        {links(true)}
      </nav>
    </div>
  );
}
