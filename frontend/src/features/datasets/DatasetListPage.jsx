import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

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
        setDatasets(res.data.items || res.data || []);
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
      toast.success('Batch dataset berhasil dibuat!');
      setModalOpen(false);
      setForm({ name: '', description: '' });
      fetchDatasets(1);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal membuat batch dataset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        heading="Batch Dataset Mahasiswa"
        subheading="Kelola kumpulan berkas dan data pendaftar beasiswa per periode"
        eyebrow="Data Mahasiswa · SPK Beasiswa"
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
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Buat Batch Baru</span>
          </button>
        }
      />

      <section className="panel" aria-labelledby="datasetListTitle">
        <div className="panel-head">
          <div>
            <h2 className="panel-title" id="datasetListTitle">
              Daftar Batch Dataset
            </h2>
            <p className="panel-sub">
              Total {datasets.length} batch dataset terdaftar di sistem
            </p>
          </div>
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
            <p className="text-muted mt-2">Memuat dataset...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="p-4 text-center">
            <div className="alert alert-info d-inline-block">
              Belum ada batch dataset. Klik <strong>Buat Batch Baru</strong> untuk memulai.
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-data table-stack">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '50px' }}>
                      #
                    </th>
                    <th scope="col">Nama Batch</th>
                    <th scope="col">Deskripsi</th>
                    <th scope="col" className="text-end">
                      Records
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col">Tanggal Dibuat</th>
                    <th scope="col" className="text-end">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((d, idx) => (
                    <tr key={d.id}>
                      <td className="num">{(page - 1) * 10 + idx + 1}</td>
                      <td className="cell-main">
                        <span
                          className="fw-semibold text-primary cursor-pointer"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/datasets/${d.id}`)}
                        >
                          {d.name}
                        </span>
                      </td>
                      <td>{d.description || <span className="text-muted">-</span>}</td>
                      <td className="num text-end">{d.record_count ?? 0}</td>
                      <td>
                        <span
                          className={`status status-${
                            d.status === 'validated'
                              ? 'success'
                              : d.status === 'imported'
                                ? 'info'
                                : d.status === 'rejected'
                                  ? 'danger'
                                  : 'neutral'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="num">
                        {d.created_at
                          ? new Date(d.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate(`/datasets/${d.id}`)}
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/datasets/${d.id}/import`)}
                          >
                            Import CSV
                          </button>
                        </div>
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
                      aria-label="Halaman sebelumnya"
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
                        aria-current={p === page ? 'page' : undefined}
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
                      aria-label="Halaman berikutnya"
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

      {/* Modal Buat Batch Baru */}
      {modalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Buat Batch Dataset Baru</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="batchName">
                      Nama Batch *
                    </label>
                    <input
                      id="batchName"
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Contoh: Pendaftar Semester Gasal 2026"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="batchDesc">
                      Deskripsi
                    </label>
                    <textarea
                      id="batchDesc"
                      rows={3}
                      className="form-control"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Keterangan opsional mengenai dataset pendaftaran ini"
                    />
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
                    {saving ? 'Menyimpan...' : 'Simpan Batch'}
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
