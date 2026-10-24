import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

const STATUS_COLORS = { draft: 'secondary', imported: 'info', validated: 'success', rejected: 'danger' };

export default function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nim: '', nama: '', ipk: '', penghasilan_ortu: '',
    jumlah_tanggungan: '', skor_prestasi_akademik: '',
    skor_prestasi_nonakademik: '', persentase_kehadiran: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchDataset = () => {
    apiClient
      .get(API.DATASETS.DETAIL(id))
      .then((res) => setDataset(res.data))
      .catch(() => toast.error('Gagal memuat detail dataset'));
  };

  const fetchRecords = (p = 1, search = '') => {
    setLoading(true);
    apiClient
      .get(API.RECORDS.LIST, { params: { dataset_id: id, page: p, page_size: 10, search } })
      .then((res) => {
        setRecords(res.data.items || res.data);
        setTotalPages(res.data.total_pages || 1);
      })
      .catch(() => toast.error('Gagal memuat data mahasiswa'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDataset();
    fetchRecords(1);
  }, [id]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords(1, filter);
    setPage(1);
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post(API.RECORDS.CREATE, { ...form, dataset_id: parseInt(id) });
      toast.success('Record berhasil ditambahkan');
      setModalOpen(false);
      setForm({ nim: '', nama: '', ipk: '', penghasilan_ortu: '', jumlah_tanggungan: '', skor_prestasi_akademik: '', skor_prestasi_nonakademik: '', persentase_kehadiran: '' });
      fetchRecords(page, filter);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menambah record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        heading={dataset ? dataset.name : 'Detail Dataset'}
        subheading="Data mahasiswa dalam batch ini"
        icon="pe-7s-folder icon-gradient bg-mean-fruit"
      />
      {dataset && (
        <Card className="mb-3">
          <CardBody>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5>{dataset.name}</h5>
                <p className="text-muted mb-1">{dataset.description || 'Tidak ada deskripsi'}</p>
                <span className={`badge bg-${STATUS_COLORS[dataset.status] || 'secondary'}`}>
                  {dataset.status}
                </span>
              </div>
              <Button color="success" size="sm" onClick={() => navigate(`/datasets/${id}/import`)}>
                <i className="pe-7s-upload me-1" />
                Import CSV
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Data Mahasiswa</h5>
            <Button color="primary" size="sm" onClick={() => setModalOpen(true)}>
              <i className="pe-7s-plus me-1" />
              Tambah Manual
            </Button>
          </div>

          <form onSubmit={handleSearch} className="d-flex mb-3">
            <Input
              type="text"
              placeholder="Cari NIM atau nama..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="me-2"
            />
            <Button type="submit" color="secondary">Cari</Button>
          </form>

          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
          ) : records.length === 0 ? (
            <div className="alert alert-info">Belum ada data mahasiswa.</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle table-sm">
                  <thead>
                    <tr>
                      <th>NIM</th>
                      <th>Nama</th>
                      <th>IPK</th>
                      <th>Penghasilan Ortu</th>
                      <th>Tanggungan</th>
                      <th>Prestasi Akademik</th>
                      <th>Prestasi Non-Akademik</th>
                      <th>Kehadiran (%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.nim}</td>
                        <td>{r.nama}</td>
                        <td>{r.ipk}</td>
                        <td>{r.penghasilan_ortu?.toLocaleString('id-ID')}</td>
                        <td>{r.jumlah_tanggungan}</td>
                        <td>{r.skor_prestasi_akademik}</td>
                        <td>{r.skor_prestasi_nonakademik}</td>
                        <td>{r.persentase_kehadiran}%</td>
                        <td>
                          <span className={`badge bg-${r.is_valid ? 'success' : 'warning'}`}>
                            {r.is_valid ? 'Valid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination pagination-sm">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => { setPage(page - 1); fetchRecords(page - 1, filter); }}>&laquo;</button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => { setPage(p); fetchRecords(p, filter); }}>{p}</button>
                        </li>
                      ))}
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => { setPage(page + 1); fetchRecords(page + 1, filter); }}>&raquo;</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>Tambah Record Mahasiswa</ModalHeader>
        <Form onSubmit={handleAddRecord}>
          <ModalBody>
            <div className="row g-3">
              {[
                { key: 'nim', label: 'NIM', type: 'text' },
                { key: 'nama', label: 'Nama Lengkap', type: 'text' },
                { key: 'ipk', label: 'IPK (0-4)', type: 'number', step: '0.01', min: '0', max: '4' },
                { key: 'penghasilan_ortu', label: 'Penghasilan Orang Tua (Rp)', type: 'number', min: '0' },
                { key: 'jumlah_tanggungan', label: 'Jumlah Tanggungan', type: 'number', min: '0' },
                { key: 'skor_prestasi_akademik', label: 'Skor Prestasi Akademik', type: 'number', min: '0', max: '100' },
                { key: 'skor_prestasi_nonakademik', label: 'Skor Prestasi Non-Akademik', type: 'number', min: '0', max: '100' },
                { key: 'persentase_kehadiran', label: 'Persentase Kehadiran (%)', type: 'number', min: '0', max: '100' },
              ].map(({ key, label, type, ...rest }) => (
                <div key={key} className="col-md-6">
                  <FormGroup>
                    <Label>{label} *</Label>
                    <Input
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      required
                      {...rest}
                    />
                  </FormGroup>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button color="primary" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  );
}
