import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, ShoppingCart, Zap, Swords, LayoutDashboard, LogIn, Trophy, Users, Sun, Moon, Flame, Menu, X } from 'lucide-react';
import { UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useProgress } from '../../context/ProgressContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

const NAV_ITEMS = [
  { path: '/',             label: 'Home',        icon: Zap },
  { path: '/map',          label: 'World Map',   icon: Map },
  { path: '/pvp',          label: 'Arena',       icon: Swords },
  { path: '/leaderboard',  label: 'Leaderboard', icon: Trophy },
  { path: '/community',    label: 'Community',   icon: Users },
  { path: '/shop',         label: 'Shop',        icon: ShoppingCart },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { isDark, toggleTheme } = useTheme();
  const [drawerPath, setDrawerPath] = useState(null);
  const mobileMenuOpen = drawerPath === location.pathname;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" aria-label="Codo Leveling Home">
          <img src="/CodoLvling.webp" alt="Codo" className="navbar-logo-img" />
        </Link>

        <SignedIn>
          <nav className="navbar-nav" aria-label="Primary Navigation">
            {NAV_ITEMS.map((item) => {
              const { path, label } = item;
              const isActive = path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`navbar-link ${isActive ? 'active' : ''}`}
                  title={label}
                >
                  <item.icon size={14} strokeWidth={1.85} className="navbar-link-icon" />
                  <span className="navbar-link-text">{label}</span>
                  {isActive && <span className="navbar-active-dot" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>

          <div className="navbar-right">
            <div className="nav-stats">
              <div className="stat-item tokens" title="Battle Tokens (5 needed for Battle Ground)">
                <Flame size={12} strokeWidth={2} />
                <span>{progress.battleTokens || 0}/5</span>
              </div>
              <div className="stat-item coins" title="Coins">
                <Zap size={12} strokeWidth={2} />
                <span>{progress.coins?.toLocaleString() || 0}</span>
              </div>
              <div className="stat-item level" title="Current Level">
                <span>LVL {progress.level || 1}</span>
              </div>
            </div>

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="theme-toggle-btn"
            >
              {isDark ? <Sun size={15} strokeWidth={1.85} /> : <Moon size={15} strokeWidth={1.85} />}
            </button>

            <div className="user-control">
              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Dashboard"
                    labelIcon={<LayoutDashboard size={16} />}
                    href="/dashboard"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>

            <button
              type="button"
              className="navbar-mobile-toggle"
              onClick={() => setDrawerPath((prev) => (prev === location.pathname ? null : location.pathname))}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} strokeWidth={1.85} /> : <Menu size={18} strokeWidth={1.85} />}
            </button>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="navbar-right" style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="theme-toggle-btn-guest"
            >
              {isDark ? <Sun size={15} strokeWidth={1.85} /> : <Moon size={15} strokeWidth={1.85} />}
            </button>
            <button
              type="button"
              className="navbar-signin-btn"
              onClick={() => navigate('/login')}
            >
              <LogIn size={15} strokeWidth={1.85} />
              <span>Sign In</span>
            </button>
          </div>
        </SignedOut>
      </div>

      <SignedIn>
        {mobileMenuOpen && (
          <nav className="navbar-mobile-drawer" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => {
              const { path, label } = item;
              const isActive = path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`navbar-mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setDrawerPath(null)}
                >
                  <span className="navbar-mobile-link-left">
                    <item.icon size={15} strokeWidth={1.85} />
                    <span>{label}</span>
                  </span>
                  {isActive && <span className="navbar-mobile-active-tag">ACTIVE</span>}
                </Link>
              );
            })}
          </nav>
        )}
      </SignedIn>
    </header>
  );
}
