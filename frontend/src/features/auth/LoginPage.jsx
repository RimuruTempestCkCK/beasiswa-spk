import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { login, clearError } from './authSlice';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
  });

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(
      login({ email: form.email, password: form.password })
    );
    if (login.fulfilled.match(result)) {
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Login gagal');
    }
  };

  return (
    <div className="auth">
      <aside className="auth-aside" aria-label="About SPK Beasiswa">
        <img
          className="auth-photo"
          src="/img/campus.jpg"
          alt="Gedung Kampus Universitas"
          width="1200"
          height="1500"
        />
        <div className="auth-aside-inner">
          <div className="brand brand-on-dark" aria-label="SPK Beasiswa">
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
              <span className="brand-sub">Sistem Pendukung Keputusan</span>
            </span>
          </div>

          <div className="auth-pitch">
            <p className="auth-kicker">Data Mining &amp; Machine Learning</p>
            <p className="auth-headline">
              Prediksi kelayakan beasiswa terpadu berbasis K-Means dan Backpropagation.
            </p>
            <ul className="auth-points">
              <li>
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
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>
                  Clustering pola data mahasiswa dengan evaluasi Davies-Bouldin Index (DBI)
                </span>
              </li>
              <li>
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
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>
                  Model Backpropagation teruji untuk klasifikasi dan inferensi calon penerima
                </span>
              </li>
              <li>
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
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>
                  Jejak audit, pengelolaan dataset batch, serta laporan komprehensif
                </span>
              </li>
            </ul>
          </div>

          <p className="auth-meta">
            Semester Akademik 2026/2027 · Portal Akses Pengelola Beasiswa
          </p>
        </div>
      </aside>

      <div className="auth-main">
        <header className="auth-top">
          <div className="brand auth-brand-sm">
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
            </span>
          </div>

          <button
            type="button"
            className="icon-btn"
            data-theme-toggle
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label="Dark mode"
            title="Beralih tema gelap/terang"
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
        </header>

        <main id="main" className="auth-card" tabIndex={-1}>
          <span className="auth-lock">
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
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>

          <h1 className="auth-title">Staff Sign-In</h1>
          <p className="auth-sub">
            Masuk dengan akun staf pengelola beasiswa Anda.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="loginEmail">
                Email Kerja
              </label>
              <input
                className="form-control form-control-lg"
                id="loginEmail"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="nama@kampus.ac.id"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="loginPassword">
                Password
              </label>
              <div className="input-group input-group-lg has-validation pw-group">
                <input
                  className="form-control"
                  id="loginPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="btn pw-toggle"
                  id="pwToggle"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className="ic-hide"
                    >
                      <path d="M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className="ic-show"
                    >
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="loginRemember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="loginRemember">
                Tetap masuk di perangkat ini
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Memproses...
                </>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </form>

          <p className="auth-note">
            Sistem Khusus Staf &amp; Pengelola Beasiswa. Mahasiswa melihat pengumuman di portal akademik.
          </p>
        </main>

        <footer className="auth-footer">
          <p>&copy; {new Date().getFullYear()} Sistem Pendukung Keputusan Beasiswa</p>
        </footer>
      </div>
    </div>
  );
}
