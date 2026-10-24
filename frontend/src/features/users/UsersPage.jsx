import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
        heading="Manajemen Pengguna Sistem"
        subheading="Kelola akun dan hak akses staf pengelola seleksi beasiswa"
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Tambah Pengguna</span>
          </button>
        }
      />

      {/* Users Table Panel */}
      <section className="panel mb-4">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Daftar Pengguna Terdaftar</h2>
            <p className="panel-sub">Daftar staf, operator, penelaah, dan administrator sistem</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table-data table-stack">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Nama Pengguna</th>
                <th scope="col">Email Login</th>
                <th scope="col">Peran / Role</th>
                <th scope="col">Status Akun</th>
                <th scope="col" className="text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="num fw-bold">#{u.id}</td>
                  <td className="cell-main">
                    <span className="fw-semibold">{u.name}</span>
                  </td>
                  <td className="font-monospace text-muted">{u.email}</td>
                  <td>
                    <span className={`badge bg-${u.role === 'admin' ? 'primary' : u.role === 'reviewer' ? 'info' : 'secondary'}-subtle text-${u.role === 'admin' ? 'primary' : u.role === 'reviewer' ? 'info' : 'secondary'} border`}>
                      {u.role ? u.role.toUpperCase() : 'OPERATOR'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status status-${
                        u.is_active ? 'success' : 'neutral'
                      }`}
                    >
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setSelectedUser(u)}
                    >
                      Detail (Pop-Up)
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* POPUP MODAL: Tambah Pengguna */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        title="Tambah Pengguna Baru"
        subtitle="Daftarkan akun staf pengelola beasiswa"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              form="addUserForm"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </div>
        }
      >
        <form id="addUserForm" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="userName">
              Nama Lengkap *
            </label>
            <input
              id="userName"
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Contoh: Budi Santoso"
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="operator@beasiswa.local"
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
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="userRole">
              Peran Hak Akses *
            </label>
            <select
              id="userRole"
              className="form-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="operator">Operator (Input &amp; Prediksi Data)</option>
              <option value="reviewer">Reviewer / Penelaah (Lihat Laporan &amp; Evaluasi)</option>
              <option value="admin">Administrator (Akses Penuh Sistem)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* POPUP MODAL: Detail Pengguna */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        size="md"
        title={`Profil Pengguna: ${selectedUser?.name || ''}`}
        subtitle={`ID #${selectedUser?.id || ''}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedUser(null)}
          >
            Tutup
          </button>
        }
      >
        {selectedUser && (
          <div>
            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Status Akun</span>
                <span className="fw-bold text-success">{selectedUser.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Peran Hak Akses</span>
                <span className="badge bg-primary fs-6">{selectedUser.role.toUpperCase()}</span>
              </div>
            </div>
            <ul className="list-group list-group-flush border rounded small">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Nama Lengkap</span>
                <span className="fw-semibold">{selectedUser.name}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Email Login</span>
                <span className="font-monospace">{selectedUser.email}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Waktu Terdaftar</span>
                <span>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('id-ID') : '-'}</span>
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
