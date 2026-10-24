import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form tambah pengguna
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
  });
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Form edit pengguna
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    email: '',
    role: 'operator',
    is_active: true,
    password: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(() => {
    apiClient
      .get(API.USERS.LIST)
      .then((res) => setUsers(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Create User
  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    apiClient
      .post(API.USERS.CREATE, formData)
      .then(() => {
        toast.success('Pengguna baru berhasil ditambahkan!');
        setModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'operator' });
        setShowAddPassword(false);
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal membuat pengguna baru');
      })
      .finally(() => setSaving(false));
  };

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setEditFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: '',
    });
    setShowEditPassword(false);
    setEditModalOpen(true);
  };

  // Handle Update User
  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editFormData.id) return;
    setSaving(true);

    const payload = {
      name: editFormData.name,
      role: editFormData.role,
      is_active: editFormData.is_active,
    };
    if (editFormData.password && editFormData.password.trim() !== '') {
      payload.password = editFormData.password.trim();
    }

    apiClient
      .patch(API.USERS.UPDATE(editFormData.id), payload)
      .then(() => {
        toast.success(`Data pengguna #${editFormData.id} berhasil diperbarui!`);
        setEditModalOpen(false);
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal memperbarui pengguna');
      })
      .finally(() => setSaving(false));
  };

  // Prompt Delete
  const handlePromptDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    setDeleting(true);
    apiClient
      .delete(API.USERS.DELETE(userToDelete.id))
      .then(() => {
        toast.success(`Pengguna ${userToDelete.name} berhasil dihapus!`);
        setDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal menghapus pengguna');
      })
      .finally(() => setDeleting(false));
  };

  return (
    <>
      <PageTitle
        heading="Manajemen Pengguna Sistem"
        subheading="Kelola akun, hak akses peran, ubah kata sandi, dan hapus pengguna staf"
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
                    <div className="d-inline-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedUser(u)}
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleOpenEdit(u)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handlePromptDelete(u)}
                      >
                        Hapus
                      </button>
                    </div>
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
            <div className="input-group">
              <input
                id="userPassword"
                type={showAddPassword ? 'text' : 'password'}
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowAddPassword(!showAddPassword)}
                title={showAddPassword ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
              >
                {showAddPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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

      {/* POPUP MODAL: Edit Pengguna */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        size="md"
        title={`Edit Pengguna: ${editFormData.name || ''}`}
        subtitle={`ID #${editFormData.id || ''} — Ubah data profil, peran, dan kata sandi`}
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              form="editUserForm"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
            </button>
          </div>
        }
      >
        <form id="editUserForm" onSubmit={handleUpdate}>
          <div className="mb-3">
            <label className="form-label" htmlFor="editUserName">
              Nama Lengkap *
            </label>
            <input
              id="editUserName"
              type="text"
              className="form-control"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="editUserEmail">
              Alamat Email (Akun Login)
            </label>
            <input
              id="editUserEmail"
              type="email"
              className="form-control bg-light"
              value={editFormData.email}
              disabled
              title="Email login bersifat unik dan tidak dapat diubah"
            />
            <div className="form-text">Alamat email terdaftar sebagai identitas unik.</div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="editUserRole">
              Peran Hak Akses *
            </label>
            <select
              id="editUserRole"
              className="form-select"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
            >
              <option value="operator">Operator (Input &amp; Prediksi Data)</option>
              <option value="reviewer">Reviewer / Penelaah (Lihat Laporan &amp; Evaluasi)</option>
              <option value="admin">Administrator (Akses Penuh Sistem)</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="editUserStatus">
              Status Akun *
            </label>
            <select
              id="editUserStatus"
              className="form-select"
              value={editFormData.is_active ? 'true' : 'false'}
              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'true' })}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif / Dibekukan</option>
            </select>
          </div>

          <div className="mb-3 border-top pt-3">
            <label className="form-label" htmlFor="editUserPassword">
              Ubah Kata Sandi Baru (Opsional)
            </label>
            <div className="input-group">
              <input
                id="editUserPassword"
                type={showEditPassword ? 'text' : 'password'}
                className="form-control"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Kosongkan jika tidak ingin mengubah password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowEditPassword(!showEditPassword)}
                title={showEditPassword ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
              >
                {showEditPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="form-text">Isi kolom ini hanya jika Anda ingin mereset password akun pengguna ini.</div>
          </div>
        </form>
      </Modal>

      {/* POPUP MODAL: Konfirmasi Hapus Pengguna */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        size="sm"
        title="Konfirmasi Hapus Pengguna"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        }
      >
        <p className="mb-0">
          Apakah Anda yakin ingin menghapus akun pengguna{' '}
          <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
        </p>
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
