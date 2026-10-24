import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

const STATUS_COLORS = {
  draft: 'secondary',
  imported: 'info',
  validated: 'success',
  rejected: 'danger',
};

export default function DatasetListPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchDatasets = (p = 1) => {
    setLoading(true);
    apiClient
      .get(API.DATASETS.LIST, { params: { page: p, page_size: 10 } })
      .then((res) => {
        setDatasets(res.data.items || res.data);
        setTotalPages(res.data.total_pages || 1);
      })
      .catch(() => toast.error('Gagal memuat daftar dataset'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDatasets(page);
  }, [page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post(API.DATASETS.CREATE, form);
      toast.success('Dataset batch berhasil dibuat');
      setModalOpen(false);
      setForm({ name: '', description: '' });
      fetchDatasets(1);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal membuat dataset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        heading="Daftar Dataset"
        subheading="Kelola batch dataset mahasiswa"
        icon="pe-7s-folder icon-gradient bg-mean-fruit"
      />
      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Dataset Batch</h5>
            <Button color="primary" onClick={() => setModalOpen(true)}>
              <i className="pe-7s-plus me-2" />
              Buat Batch Baru
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="alert alert-info">Belum ada dataset batch. Buat yang pertama!</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nama Batch</th>
                      <th>Deskripsi</th>
                      <th>Records</th>
                      <th>Status</th>
                      <th>Dibuat</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((d, idx) => (
                      <tr key={d.id}>
                        <td>{(page - 1) * 10 + idx + 1}</td>
                        <td>{d.name}</td>
                        <td>{d.description || '-'}</td>
                        <td>{d.record_count ?? '-'}</td>
                        <td>
                          <span className={`badge bg-${STATUS_COLORS[d.status] || 'secondary'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td>{d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : '-'}</td>
                        <td>
                          <Button
                            color="info"
                            size="sm"
                            className="me-1"
                            onClick={() => navigate(`/datasets/${d.id}`)}
                          >
                            Detail
                          </Button>
                          <Button
                            color="success"
                            size="sm"
                            onClick={() => navigate(`/datasets/${d.id}/import`)}
                          >
                            Import CSV
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(page - 1)}>
                          &laquo;
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setPage(p)}>
                            {p}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(page + 1)}>
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>Buat Batch Baru</ModalHeader>
        <Form onSubmit={handleCreate}>
          <ModalBody>
            <FormGroup>
              <Label for="batchName">Nama Batch *</Label>
              <Input
                id="batchName"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g., Batch Semester Genap 2024"
              />
            </FormGroup>
            <FormGroup>
              <Label for="batchDesc">Deskripsi</Label>
              <Input
                id="batchDesc"
                type="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi opsional"
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  );
}
