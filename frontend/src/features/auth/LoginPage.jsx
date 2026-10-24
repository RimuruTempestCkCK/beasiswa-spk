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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ username: form.email, password: form.password }));
    if (login.fulfilled.match(result)) {
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Login gagal');
    }
  };

  return (
    <div className="h-100 bg-animation">
      <div className="d-flex h-100 justify-content-center align-items-center">
        <div className="mx-auto app-login-box col-md-8">
          <div className="app-logo-inverse mx-auto mb-3" />
          <div className="app-logo-text d-none d-md-block mx-auto mb-3 text-center">
            <h4 className="fw-bold text-white">SPK Beasiswa</h4>
            <p className="text-white-50">Sistem Prediksi Kelayakan Beasiswa</p>
          </div>
          <div className="modal-dialog w-100 mx-auto">
            <div className="modal-content">
              <div className="modal-body">
                <div className="h5 modal-title text-center">
                  <h4 className="mt-2">
                    <div>Selamat Datang,</div>
                    <span>Silakan masuk ke akun Anda.</span>
                  </h4>
                </div>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="Masukkan email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="form-control"
                      placeholder="Masukkan password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="divider" />
                  <div className="d-flex align-items-center justify-content-end">
                    <div className="ms-auto">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
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
                          'Masuk'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="text-center text-white opacity-8 mt-3">
            Copyright &copy; SPK Beasiswa {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
