import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

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
      fetchRecords(page, filter);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menambah record mahasiswa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        heading={dataset ? dataset.name : 'Data Mahasiswa'}
        subheading="Daftar calon mahasiswa dan atribut akademik/sosial-ekonomi dalam batch ini"
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
            {id && (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => navigate(`/datasets/${id}/import`)}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>Import File CSV</span>
              </button>
            )}
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
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Tambah Mahasiswa</span>
            </button>
          </div>
        }
      />

      {/* Batch Overview Panel */}
      {dataset && (
        <section className="panel mb-4">
          <div className="panel-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h3 className="h5 mb-1 fw-bold">{dataset.name}</h3>
                <p className="text-muted mb-0">{dataset.description || 'Tidak ada deskripsi tambahan'}</p>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted small">
                  Status Batch:
                </span>
                <span
                  className={`status status-${
                    dataset.status === 'validated'
                      ? 'success'
                      : dataset.status === 'imported'
                        ? 'info'
                        : dataset.status === 'rejected'
                          ? 'danger'
                          : 'neutral'
                  }`}
                >
                  {dataset.status}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Records Table Panel */}
      <section className="panel">
        <div className="panel-head panel-head-flush">
          <form className="filter-bar w-100" onSubmit={handleSearch}>
            <div className="filter-search flex-grow-1">
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
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                className="form-control"
                placeholder="Cari berdasarkan NIM atau Nama mahasiswa..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-outline-secondary">
              Cari
            </button>
            {filter && (
              <button
                type="button"
                className="btn btn-link btn-clear"
                onClick={() => {
                  setFilter('');
                  fetchRecords(1, '');
                }}
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: '2.5rem', height: '2.5rem' }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Memuat rekod mahasiswa...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-muted mb-0">Belum ada data mahasiswa untuk batch ini.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-data table-stack">
                <thead>
                  <tr>
                    <th scope="col">NIM</th>
                    <th scope="col">Nama Mahasiswa</th>
                    <th scope="col" className="text-end">IPK</th>
                    <th scope="col" className="text-end">Penghasilan Ortu</th>
                    <th scope="col" className="text-end">Tanggungan</th>
                    <th scope="col" className="text-end">Prestasi Akad.</th>
                    <th scope="col" className="text-end">Prestasi Non-Akad.</th>
                    <th scope="col" className="text-end">Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="num fw-semibold">{r.nim}</td>
                      <td className="cell-main">{r.nama}</td>
                      <td className="num text-end">
                        {r.ipk !== undefined && r.ipk !== null ? Number(r.ipk).toFixed(2) : '-'}
                      </td>
                      <td className="num text-end">
                        {r.penghasilan_ortu !== undefined && r.penghasilan_ortu !== null
                          ? `Rp ${Number(r.penghasilan_ortu).toLocaleString('id-ID')}`
                          : '-'}
                      </td>
                      <td className="num text-end">{r.jumlah_tanggungan ?? '-'}</td>
                      <td className="num text-end">{r.skor_prestasi_akademik ?? '-'}</td>
                      <td className="num text-end">{r.skor_prestasi_nonakademik ?? '-'}</td>
                      <td className="num text-end">
                        {r.persentase_kehadiran !== undefined && r.persentase_kehadiran !== null
                          ? `${r.persentase_kehadiran}%`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="panel-foot">
                <p className="pager-info">
                  Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
                </p>
                <ul className="pager">
                  <li>
                    <button
                      type="button"
                      className="pager-btn"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        className={`pager-btn ${p === page ? 'is-current' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      className="pager-btn"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal Tambah Record */}
      {modalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Mahasiswa Baru</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                />
              </div>
              <form onSubmit={handleAddRecord}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="recNim">
                        NIM *
                      </label>
                      <input
                        id="recNim"
                        type="text"
                        className="form-control"
                        value={form.nim}
                        onChange={(e) => setForm({ ...form, nim: e.target.value })}
                        required
                        placeholder="Contoh: 202601001"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="recNama">
                        Nama Lengkap *
                      </label>
                      <input
                        id="recNama"
                        type="text"
                        className="form-control"
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        required
                        placeholder="Nama mahasiswa"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="recIpk">
                        IPK (0.00 - 4.00) *
                      </label>
                      <input
                        id="recIpk"
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
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="recGaji">
                        Penghasilan Orang Tua (Rp) *
                      </label>
                      <input
                        id="recGaji"
                        type="number"
                        min="0"
                        className="form-control"
                        value={form.penghasilan_ortu}
                        onChange={(e) =>
                          setForm({ ...form, penghasilan_ortu: e.target.value })
                        }
                        required
                        placeholder="Contoh: 2500000"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="recTanggungan">
                        Jumlah Tanggungan *
                      </label>
                      <input
                        id="recTanggungan"
                        type="number"
                        min="0"
                        className="form-control"
                        value={form.jumlah_tanggungan}
                        onChange={(e) =>
                          setForm({ ...form, jumlah_tanggungan: e.target.value })
                        }
                        required
                        placeholder="Contoh: 3"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="recPrestasiAkad">
                        Skor Prestasi Akademik (0 - 100) *
                      </label>
                      <input
                        id="recPrestasiAkad"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-control"
                        value={form.skor_prestasi_akademik}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            skor_prestasi_akademik: e.target.value,
                          })
                        }
                        required
                        placeholder="Contoh: 85"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="recPrestasiNon">
                        Skor Prestasi Nonakademik (0 - 100) *
                      </label>
                      <input
                        id="recPrestasiNon"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-control"
                        value={form.skor_prestasi_nonakademik}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            skor_prestasi_nonakademik: e.target.value,
                          })
                        }
                        required
                        placeholder="Contoh: 70"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="recKehadiran">
                        Kehadiran (%) *
                      </label>
                      <input
                        id="recKehadiran"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-control"
                        value={form.persentase_kehadiran}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            persentase_kehadiran: e.target.value,
                          })
                        }
                        required
                        placeholder="Contoh: 95.5"
                      />
                    </div>
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
                    {saving ? 'Menyimpan...' : 'Simpan Data'}
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
