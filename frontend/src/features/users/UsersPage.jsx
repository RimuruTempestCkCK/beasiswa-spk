import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Tambah Pengguna</span>
          </button>
        }
      />

      <div className="row g-3 g-xxl-4 mb-4">
        {/* Users Table */}
        <div className="col-lg-6">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Daftar Pengguna Sistem</h2>
                <p className="panel-sub">Staf dan pengelola seleksi beasiswa</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table-data table-compact">
                <thead>
                  <tr>
                    <th scope="col">Nama / Email</th>
                    <th scope="col">Peran</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="cell-main">
                        <span className="fw-semibold">{u.name}</span>
                        <span className="cell-sub">{u.email}</span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {u.role}
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
                      <td colSpan={4} className="text-center text-muted py-4">
                        Belum ada pengguna terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Audit Logs Table */}
        <div className="col-lg-6">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Jejak Aktivitas (Audit Logs)</h2>
                <p className="panel-sub">Catatan riwayat perubahan dan operasi sistem</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table-data table-compact">
                <thead>
                  <tr>
                    <th scope="col">Waktu</th>
                    <th scope="col">Aktivitas</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="num">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="cell-main">
                        <span className="fw-semibold">{log.action || log.event}</span>
                        {log.entity && <span className="cell-sub">{log.entity}</span>}
                      </td>
                      <td>
                        <span
                          className={`status status-${
                            log.status === 'success' || !log.status
                              ? 'success'
                              : 'danger'
                          }`}
                        >
                          {log.status || 'success'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedLog(log)}
                        >
                          Lihat Log
                        </button>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        Belum ada rekaman audit log.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

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
                <span className="text-muted small d-block">Peran</span>
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
                <span>Waktu Dibuat</span>
                <span>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('id-ID') : '-'}</span>
              </li>
            </ul>
          </div>
        )}
      </Modal>

      {/* POPUP MODAL: Detail Audit Log */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        size="md"
        title={`Detail Audit Log #${selectedLog?.id || ''}`}
        subtitle={`Aksi: ${selectedLog?.action || selectedLog?.event || '-'}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedLog(null)}
          >
            Tutup
          </button>
        }
      >
        {selectedLog && (
          <div>
            <ul className="list-group list-group-flush border rounded small mb-3">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Operasi / Action</span>
                <span className="fw-bold font-monospace">{selectedLog.action || selectedLog.event}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Entity Terkait</span>
                <span>{selectedLog.entity || '-'} (ID: {selectedLog.entity_id || '-'})</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>User Pelaksana</span>
                <span>ID User #{selectedLog.user_id || 'Sistem'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Waktu Kejadian</span>
                <span>{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('id-ID') : '-'}</span>
              </li>
            </ul>
            {selectedLog.details && (
              <div className="p-3 bg-light rounded border small">
                <strong>Payload / Detail:</strong>
                <pre className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                  {typeof selectedLog.details === 'object'
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : selectedLog.details}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
