import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form, setForm] = useState({
    nim: '',
    nama: '',
    ipk: '',
    penghasilan_ortu: '',
    jumlah_tanggungan: '',
    skor_prestasi_akademik: '',
    skor_prestasi_nonakademik: '',
    persentase_kehadiran: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchDataset = () => {
    if (!id) return;
    apiClient
      .get(API.DATASETS.DETAIL(id))
      .then((res) => setDataset(res.data))
      .catch(() => toast.error('Gagal memuat detail dataset'));
  };

  const fetchRecords = (p = 1, search = '') => {
    setLoading(true);
    const params = { page: p, page_size: 10, search };
    if (id) params.dataset_id = id;

    apiClient
      .get(API.RECORDS.LIST, { params })
      .then((res) => {
        setRecords(res.data.items || res.data || []);
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
      const payload = {
        ...form,
        dataset_id: id ? parseInt(id) : undefined,
        ipk: parseFloat(form.ipk),
        penghasilan_ortu: parseFloat(form.penghasilan_ortu),
        jumlah_tanggungan: parseInt(form.jumlah_tanggungan),
        skor_prestasi_akademik: parseFloat(form.skor_prestasi_akademik),
        skor_prestasi_nonakademik: parseFloat(form.skor_prestasi_nonakademik),
        persentase_kehadiran: parseFloat(form.persentase_kehadiran),
      };
      await apiClient.post(API.RECORDS.CREATE, payload);
      toast.success('Record mahasiswa berhasil ditambahkan');
      setModalOpen(false);
      setForm({
        nim: '',
        nama: '',
        ipk: '',
        penghasilan_ortu: '',
        jumlah_tanggungan: '',
        skor_prestasi_akademik: '',
        skor_prestasi_nonakademik: '',
        persentase_kehadiran: '',
      });
      fetchRecords(1);
      fetchDataset();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menambahkan data');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDetail = (record) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  return (
    <>
      <PageTitle
        heading={dataset?.batch_name || dataset?.name || 'Detail Batch Dataset'}
        subheading={`Batch #${id} · ${dataset?.total_rows || dataset?.record_count || 0} Mahasiswa terdaftar`}
        eyebrow="Data Mahasiswa · SPK Beasiswa"
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate('/datasets')}
            >
              &larr; Kembali
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate(`/datasets/${id}/import`)}
            >
              Upload CSV
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              + Tambah Record
            </button>
          </div>
        }
      />

      {/* Filter and Table Panel */}
      <section className="panel">
        <div className="panel-head flex-wrap gap-2">
          <div>
            <h2 className="panel-title">Data Mahasiswa Calon Penerima</h2>
            <p className="panel-sub">Tabel 6 indikator evaluasi akademik &amp; sosio-ekonomi</p>
          </div>
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Cari NIM atau Nama..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 220 }}
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Cari
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2">Memuat data mahasiswa...</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table-data table-stack">
              <thead>
                <tr>
                  <th scope="col">NIM / Kode</th>
                  <th scope="col">Nama Mahasiswa</th>
                  <th scope="col" className="text-end">IPK</th>
                  <th scope="col" className="text-end">Penghasilan Ortu</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="num fw-bold">{r.student_code || r.nim || `#${i + 1}`}</td>
                    <td className="cell-main">
                      <span className="fw-semibold">{r.student_name || r.nama || '-'}</span>
                    </td>
                    <td className="num text-end">
                      {r.ipk !== undefined && r.ipk !== null ? Number(r.ipk).toFixed(2) : '-'}
                    </td>
                    <td className="num text-end">
                      {r.parent_income !== undefined && r.parent_income !== null
                        ? `Rp ${Number(r.parent_income).toLocaleString('id-ID')}`
                        : r.penghasilan_ortu !== undefined && r.penghasilan_ortu !== null
                          ? `Rp ${Number(r.penghasilan_ortu).toLocaleString('id-ID')}`
                          : '-'}
                    </td>
                    <td>
                      <span
                        className={`status status-${
                          r.data_status === 'validated' || r.status === 'valid'
                            ? 'success'
                            : r.data_status === 'invalid'
                              ? 'danger'
                              : 'neutral'
                        }`}
                      >
                        {r.data_status || r.status || 'raw'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleOpenDetail(r)}
                      >
                        Lihat 6 Variabel (Pop-Up)
                      </button>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5">
                      Belum ada data mahasiswa pada batch ini. Klik tombol <strong>+ Tambah Record</strong> atau <strong>Upload CSV</strong>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3 d-flex justify-content-between align-items-center border-top">
            <span className="text-muted small">
              Halaman {page} dari {totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => {
                  const p = Math.max(1, page - 1);
                  setPage(p);
                  fetchRecords(p, filter);
                }}
              >
                Sebelumnya
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => {
                  const p = Math.min(totalPages, page + 1);
                  setPage(p);
                  fetchRecords(p, filter);
                }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </section>

      {/* POPUP MODAL: Tambah Record */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        title="Tambah Mahasiswa Baru"
        subtitle="Input 6 indikator kanonis seleksi beasiswa"
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
              form="addRecordForm"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan Data Mahasiswa'}
            </button>
          </div>
        }
      >
        <form id="addRecordForm" onSubmit={handleAddRecord}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="nim">
                NIM / Kode Mahasiswa *
              </label>
              <input
                id="nim"
                type="text"
                className="form-control"
                value={form.nim}
                onChange={(e) => setForm({ ...form, nim: e.target.value })}
                required
                placeholder="Contoh: 202100123"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="nama">
                Nama Lengkap Mahasiswa *
              </label>
              <input
                id="nama"
                type="text"
                className="form-control"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
                placeholder="Contoh: Ahmad Fauzi"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="ipk">
                Indeks Prestasi Kumulatif (0.00 - 4.00) *
              </label>
              <input
                id="ipk"
                type="number"
                step="0.01"
                min="0"
                max="4"
                className="form-control"
                value={form.ipk}
                onChange={(e) => setForm({ ...form, ipk: e.target.value })}
                required
                placeholder="Contoh: 3.75"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="penghasilan_ortu">
                Penghasilan Orang Tua (Rp) *
              </label>
              <input
                id="penghasilan_ortu"
                type="number"
                min="0"
                className="form-control"
                value={form.penghasilan_ortu}
                onChange={(e) => setForm({ ...form, penghasilan_ortu: e.target.value })}
                required
                placeholder="Contoh: 1500000"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="jumlah_tanggungan">
                Jumlah Tanggungan Keluarga *
              </label>
              <input
                id="jumlah_tanggungan"
                type="number"
                min="0"
                className="form-control"
                value={form.jumlah_tanggungan}
                onChange={(e) => setForm({ ...form, jumlah_tanggungan: e.target.value })}
                required
                placeholder="Contoh: 3"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="skor_prestasi_akademik">
                Skor Prestasi Akademik (0 - 100) *
              </label>
              <input
                id="skor_prestasi_akademik"
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="form-control"
                value={form.skor_prestasi_akademik}
                onChange={(e) => setForm({ ...form, skor_prestasi_akademik: e.target.value })}
                required
                placeholder="Contoh: 80"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="skor_prestasi_nonakademik">
                Skor Prestasi Non-Akademik (0 - 100) *
              </label>
              <input
                id="skor_prestasi_nonakademik"
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="form-control"
                value={form.skor_prestasi_nonakademik}
                onChange={(e) => setForm({ ...form, skor_prestasi_nonakademik: e.target.value })}
                required
                placeholder="Contoh: 75"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="persentase_kehadiran">
                Persentase Kehadiran (%) *
              </label>
              <input
                id="persentase_kehadiran"
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="form-control"
                value={form.persentase_kehadiran}
                onChange={(e) => setForm({ ...form, persentase_kehadiran: e.target.value })}
                required
                placeholder="Contoh: 95.0"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* POPUP MODAL: Rincian 6 Variabel Record */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        size="md"
        title={`Rincian Mahasiswa: ${selectedRecord?.student_name || selectedRecord?.nama || '-'}`}
        subtitle={`NIM: ${selectedRecord?.student_code || selectedRecord?.nim || '-'}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDetailModalOpen(false)}
          >
            Tutup
          </button>
        }
      >
        {selectedRecord && (
          <div>
            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Status Data</span>
                <span className="fw-bold fs-6 text-success">
                  {(selectedRecord.data_status || selectedRecord.status || 'valid').toUpperCase()}
                </span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">IPK</span>
                <span className="fs-5 fw-bold text-primary font-monospace">
                  {Number(selectedRecord.ipk || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <h6 className="fw-bold text-primary mb-2">Nilai 6 Parameter:</h6>
            <ul className="list-group list-group-flush border rounded small">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Indeks Prestasi Kumulatif (IPK)</span>
                <span className="fw-bold font-monospace">{Number(selectedRecord.ipk || 0).toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Penghasilan Orang Tua</span>
                <span className="fw-bold font-monospace">
                  Rp {Number(selectedRecord.parent_income || selectedRecord.penghasilan_ortu || 0).toLocaleString('id-ID')}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Jumlah Tanggungan Keluarga</span>
                <span className="fw-bold font-monospace">{selectedRecord.family_dependents || selectedRecord.jumlah_tanggungan || 0} Orang</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Skor Prestasi Akademik</span>
                <span className="fw-bold font-monospace">{selectedRecord.academic_achievement_score || selectedRecord.skor_prestasi_akademik || 0} / 100</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Skor Prestasi Non-Akademik</span>
                <span className="fw-bold font-monospace">{selectedRecord.nonacademic_achievement_score || selectedRecord.skor_prestasi_nonakademik || 0} / 100</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Persentase Kehadiran</span>
                <span className="fw-bold font-monospace">{selectedRecord.attendance_percentage || selectedRecord.persentase_kehadiran || 0}%</span>
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
