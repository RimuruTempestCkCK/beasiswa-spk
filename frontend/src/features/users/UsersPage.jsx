import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(() => {
    apiClient
      .get(API.USERS.LIST)
      .then((res) => setUsers(res.data || []))
      .catch(() => {});
  }, []);

  const fetchAuditLogs = useCallback(() => {
    apiClient
      .get(API.AUDIT_LOGS)
      .then((res) => setAuditLogs(res.data.items || res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [fetchUsers, fetchAuditLogs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    apiClient
      .post(API.USERS.CREATE, formData)
      .then(() => {
        toast.success('Pengguna baru berhasil ditambahkan!');
        setModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'operator' });
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal membuat pengguna baru');
      })
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageTitle
        heading="Pengguna &amp; Jejak Audit"
        subheading="Manajemen hak akses staf pengelola beasiswa dan pemantauan aktivitas audit sistem"
        eyebrow="Administrasi · SPK Beasiswa"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
            <span>Tambah Pengguna</span>
          </button>
        }
      />

      {/* Users Section */}
      <section className="panel mb-4">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Daftar Pengguna Sistem</h2>
            <p className="panel-sub">Akun yang memiliki wewenang akses aplikasi SPK</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table-data table-stack">
            <thead>
              <tr>
                <th scope="col" style={{ width: '60px' }}>
                  ID
                </th>
                <th scope="col">Nama Pengguna</th>
                <th scope="col">Alamat Email</th>
                <th scope="col">Peran (Role)</th>
                <th scope="col">Status Akun</th>
                <th scope="col">Tanggal Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="num fw-bold">#{u.id}</td>
                  <td className="cell-main">
                    <div className="d-flex align-items-center gap-2">
                      <span className="avatar av-2" aria-hidden="true">
                        {u.name
                          ? u.name
                              .split(' ')
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          : 'U'}
                      </span>
                      <span className="fw-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === 'admin'
                          ? 'bg-danger-subtle text-danger border border-danger'
                          : u.role === 'operator'
                            ? 'bg-primary-subtle text-primary border border-primary'
                            : 'bg-secondary-subtle text-secondary border'
                      }`}
                    >
                      {u.role ? u.role.toUpperCase() : '-'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status status-${u.is_active ? 'success' : 'neutral'}`}
                    >
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="num">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Logs Section */}
      <section className="panel mb-4">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Log Audit Aktivitas Sistem</h2>
            <p className="panel-sub">Jejak rekaman tindakan operasi dataset, model, dan inferensi</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchAuditLogs}
          >
            Refresh Log
          </button>
        </div>
        <div className="table-wrap">
          <table className="table-data table-compact">
            <thead>
              <tr>
                <th scope="col" style={{ width: '60px' }}>
                  ID
                </th>
                <th scope="col">User ID</th>
                <th scope="col">Aktivitas / Aksi</th>
                <th scope="col">Tipe Entitas</th>
                <th scope="col">ID Entitas</th>
                <th scope="col">Waktu Eksekusi</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="num">#{log.id}</td>
                  <td className="num">{log.user_id ? `User #${log.user_id}` : 'Sistem'}</td>
                  <td>
                    <span className="fw-semibold text-dark">{log.action}</span>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {log.entity_type}
                    </span>
                  </td>
                  <td className="num">{log.entity_id ? `#${log.entity_id}` : '-'}</td>
                  <td className="num">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Belum ada rekaman log aktivitas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Tambah Pengguna */}
      {modalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Pengguna Sistem Baru</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="userName">
                      Nama Lengkap *
                    </label>
                    <input
                      id="userName"
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Nama lengkap staf"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="userEmail">
                      Alamat Email *
                    </label>
                    <input
                      id="userEmail"
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder="email@kampus.ac.id"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="userPassword">
                      Kata Sandi *
                    </label>
                    <input
                      id="userPassword"
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      placeholder="Minimal 6 karakter"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="userRole">
                      Peran (Role) *
                    </label>
                    <select
                      id="userRole"
                      className="form-select"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    >
                      <option value="operator">Operator (Pengelola Data &amp; Model)</option>
                      <option value="reviewer">Reviewer (Penelaah Laporan)</option>
                      <option value="admin">Administrator (Akses Penuh)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
