import { NavLink } from 'react-router';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const navClass = ({ isActive }) =>
    `nav-item-link ${isActive ? 'is-active' : ''}`;

  return (
    <>
      <div
        id="sidebar"
        className={`sidebar offcanvas-lg offcanvas-start ${mobileOpen ? 'show' : ''}`}
        tabIndex={-1}
        aria-label="Main menu"
      >
        <div className="sidebar-inner">
          <div className="sidebar-head">
            <NavLink
              to="/dashboard"
              className="brand"
              aria-label="SPK Beasiswa: Dashboard"
              onClick={onCloseMobile}
            >
              <span className="brand-mark">
                <svg className="crest" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                  <path
                    className="crest-shield"
                    d="M16 2 4 6.5v8.2c0 7.3 5 13.3 12 15.3 7-2 12-8 12-15.3V6.5z"
                  />
                  <path className="crest-line" d="M10 14 16 9.5l6 4.5" />
                  <path className="crest-line" d="M9.5 19c2.2-1.6 4.3-1.6 6.5 0s4.3 1.6 6.5 0" />
                  <path className="crest-line" d="M9.5 23c2.2-1.6 4.3-1.6 6.5 0s4.3 1.6 6.5 0" />
                </svg>
              </span>
              <span className="brand-text">
                <span className="brand-name">SPK Beasiswa</span>
                <span className="brand-sub">Prediksi Kelayakan</span>
              </span>
            </NavLink>
            <button
              type="button"
              className="sidebar-close d-lg-none"
              onClick={onCloseMobile}
              aria-label="Close menu"
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
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="sidebar-nav" aria-label="Main">
            <p className="nav-heading">Overview</p>
            <ul className="nav-list">
              <li>
                <NavLink to="/dashboard" className={navClass} onClick={onCloseMobile}>
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
                  <span className="nav-label">Dashboard</span>
                </NavLink>
              </li>
            </ul>

            <p className="nav-heading">Data Mahasiswa</p>
            <ul className="nav-list">
              <li>
                <NavLink to="/datasets" end className={navClass} onClick={onCloseMobile}>
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                  </svg>
                  <span className="nav-label">Batch Dataset</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/datasets/import" className={navClass} onClick={onCloseMobile}>
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  <span className="nav-label">Import Dataset</span>
                </NavLink>
              </li>
            </ul>

            <p className="nav-heading">Model & Analisis</p>
            <ul className="nav-list">
              <li>
                <NavLink to="/preprocessing" className={navClass} onClick={onCloseMobile}>
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
                  <span className="nav-label">Preprocessing</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/clustering" className={navClass} onClick={onCloseMobile}>
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
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <span className="nav-label">Clustering K-Means</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/training" className={navClass} onClick={onCloseMobile}>
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
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                  </svg>
                  <span className="nav-label">Training Model</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/evaluation" className={navClass} onClick={onCloseMobile}>
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
                    <rect x="8" y="2" width="8" height="4" rx="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="m9 14 2 2 4-4" />
                  </svg>
                  <span className="nav-label">Evaluasi Model</span>
                </NavLink>
              </li>
            </ul>

            <p className="nav-heading">Prediksi & Laporan</p>
            <ul className="nav-list">
              <li>
                <NavLink to="/predictions" className={navClass} onClick={onCloseMobile}>
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
                  <span className="nav-label">Prediksi Kelayakan</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/reports" className={navClass} onClick={onCloseMobile}>
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                  <span className="nav-label">Laporan & Riwayat</span>
                </NavLink>
              </li>
            </ul>

            <p className="nav-heading">Administrasi</p>
            <ul className="nav-list">
              <li>
                <NavLink to="/users" className={navClass} onClick={onCloseMobile}>
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                  </svg>
                  <span className="nav-label">Pengguna & Audit</span>
                </NavLink>
              </li>
            </ul>

            <p className="nav-heading">Akun</p>
            <ul className="nav-list">
              <li>
                <button
                  type="button"
                  className="nav-item-link w-100 text-start border-0 bg-transparent"
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
                  <span className="nav-label">Keluar (Sign out)</span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="sidebar-foot">
            <div className="term-card">
              <p className="term-label">Sistem SPK Beasiswa</p>
              <p className="term-week">K-Means &amp; Backpropagation</p>
              <div className="term-bar" role="img" aria-label="Status Sistem">
                <span style={{ width: '100%' }}></span>
              </div>
              <p className="term-dates">Rekomendasi Analitis Data Mining</p>
            </div>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div
          className="offcanvas-backdrop fade show d-lg-none"
          onClick={onCloseMobile}
        />
      )}
    </>
  );
}
