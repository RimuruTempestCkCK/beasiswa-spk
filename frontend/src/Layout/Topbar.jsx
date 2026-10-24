import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { logout } from '../features/auth/authSlice';

export default function Topbar({ onToggleMobile, isCollapsed, onToggleCollapse }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth?.user);

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sync dark mode toggle
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', next);
    try {
      localStorage.setItem('registrar-theme', next);
    } catch {
      // storage unavailable
    }
    setIsDark(next === 'dark');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut '/' for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!e.target.closest('input, textarea, select, [contenteditable="true"]')) {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/datasets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    dispatch(logout());
  };

  const userName = user?.name || 'Administrator';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Staff SPK';
  const userEmail = user?.email || 'admin@beasiswa-spk.ac.id';

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'SP';

  const dateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="topbar">
      {/* Mobile toggle */}
      <button
        type="button"
        className="icon-btn d-lg-none"
        onClick={onToggleMobile}
        aria-label="Buka menu"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop collapse */}
      <button
        type="button"
        className="icon-btn d-none d-lg-inline-flex"
        id="sidebarCollapse"
        onClick={onToggleCollapse}
        aria-controls="sidebar"
        aria-expanded={!isCollapsed}
        aria-label="Toggle sidebar"
        title="Ciutkan atau rentangkan bilah sisi"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="m15 10-2 2 2 2" />
        </svg>
      </button>

      {/* Global search */}
      <form
        className="topbar-search"
        id="globalSearchForm"
        role="search"
        onSubmit={handleSearch}
      >
        <label className="visually-hidden" htmlFor="globalSearch">
          Cari dataset atau mahasiswa
        </label>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={searchInputRef}
          type="search"
          id="globalSearch"
          name="q"
          className="form-control"
          placeholder="Cari dataset, model, mahasiswa..."
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd className="search-kbd" aria-hidden="true">
          /
        </kbd>
      </form>

      {/* Topbar actions */}
      <div className="topbar-actions">
        <span className="topbar-date">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span>{dateStr}</span>
        </span>

        {/* Theme toggle */}
        <button
          type="button"
          className="icon-btn"
          data-theme-toggle
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label="Dark mode"
          title="Beralih mode gelap/terang"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="ic-moon"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="ic-sun"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </button>

        {/* Notifications */}
        <div className="dropdown" ref={notifRef}>
          <button
            type="button"
            className="icon-btn"
            id="notifToggle"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-expanded={notifOpen}
            aria-label="Notifikasi sistem"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            </svg>
            <span className="notif-count" aria-hidden="true">
              2
            </span>
          </button>
          {notifOpen && (
            <div
              className="dropdown-menu dropdown-menu-end notif-menu show"
              style={{ display: 'block' }}
            >
              <div className="notif-head">
                <p className="notif-heading">Notifikasi Sistem</p>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setNotifOpen(false)}
                >
                  Tutup
                </button>
              </div>
              <ul className="notif-list">
                <li>
                  <Link
                    className="notif is-unread"
                    to="/clustering"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span className="notif-icon tone-teal">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </span>
                    <span className="notif-text">
                      <span className="notif-title">
                        Eksperimen K-Means siap dianalisis
                      </span>
                      <span className="notif-meta">Pola Klaster &amp; DBI</span>
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    className="notif is-unread"
                    to="/predictions"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span className="notif-icon tone-primary">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                      </svg>
                    </span>
                    <span className="notif-text">
                      <span className="notif-title">
                        Inferensi model Backpropagation aktif
                      </span>
                      <span className="notif-meta">Prediksi Kelayakan</span>
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="dropdown" ref={userMenuRef}>
          <button
            type="button"
            className="user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-label={`Menu akun, ${userName}`}
          >
            <span className="avatar av-2" aria-hidden="true">
              {initials}
            </span>
            <span className="user-text">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRole}</span>
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {userMenuOpen && (
            <ul
              className="dropdown-menu dropdown-menu-end user-menu show"
              style={{ display: 'block' }}
            >
              <li className="user-menu-head">
                <span className="avatar av-2 avatar-lg" aria-hidden="true">
                  {initials}
                </span>
                <span>
                  <span className="user-name">{userName}</span>
                  <span className="user-role">{userEmail}</span>
                </span>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/dashboard"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect x="3" y="3" width="7" height="9" rx="1.5" />
                    <rect x="14" y="3" width="7" height="5" rx="1.5" />
                    <rect x="14" y="12" width="7" height="9" rx="1.5" />
                    <rect x="3" y="16" width="7" height="5" rx="1.5" />
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/predictions"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                  </svg>
                  Prediksi Cepat
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/users"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Pengguna &amp; Audit
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item text-danger border-0 bg-transparent w-100 text-start"
                  onClick={handleLogout}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Keluar (Sign out)
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
