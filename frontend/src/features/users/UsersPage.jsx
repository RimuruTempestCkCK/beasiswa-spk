import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Table, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'operator' });

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const fetchUsers = () => {
    apiClient.get(API.USERS.LIST).then((res) => setUsers(res.data)).catch(() => {});
  };

  const fetchAuditLogs = () => {
    apiClient.get(API.AUDIT_LOGS).then((res) => setAuditLogs(res.data.items || res.data)).catch(() => {});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    apiClient
      .post(API.USERS.CREATE, formData)
      .then(() => {
        toast.success('Pengguna berhasil ditambahkan');
        setModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'operator' });
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal membuat pengguna');
      });
  };

  return (
    <div>
      <PageTitle
        heading="Pengguna & Jejak Audit"
        subheading="Manajemen akun sistem pendukung keputusan dan monitoring aktivitas"
        icon="pe-7s-config icon-gradient bg-premium-dark"
      />

      <Card className="main-card mb-4">
        <CardHeader className="d-flex justify-content-between align-items-center">
          <span>Daftar Pengguna Sistem</span>
          <Button color="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Tambah Pengguna
          </Button>
        </CardHeader>
        <CardBody>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Peran (Role)</th>
                <th>Status</th>
                <th>Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <Badge color={u.role === 'admin' ? 'danger' : u.role === 'operator' ? 'primary' : 'info'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td>
                    <Badge color={u.is_active ? 'success' : 'secondary'}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Card className="main-card mb-3">
        <CardHeader>Log Audit Aktivitas</CardHeader>
        <CardBody>
          <Table responsive hover size="sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Aksi</th>
                <th>Tipe Entitas</th>
                <th>ID Entitas</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.user_id || '-'}</td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.entity_type}</td>
                  <td>{log.entity_id || '-'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted">Belum ada catatan log audit.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Tambah Pengguna Baru</ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Nama Lengkap</Label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Alamat Email</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Kata Sandi</Label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Peran (Role)</Label>
              <Input
                type="select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="operator">Operator</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </Input>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button color="primary" type="submit">Simpan</Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
}
