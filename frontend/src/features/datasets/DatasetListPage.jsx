import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function DatasetListPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
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

  const handleOpenDetail = (batch) => {
    setSelectedBatch(batch);
    setDetailModalOpen(true);
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Buat Batch Baru</span>
          </button>
        }
      />

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Daftar Batch Terdaftar</h2>
            <p className="panel-sub">Arsip batch data mahasiswa calon penerima beasiswa</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2">Memuat batch dataset...</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table-data table-stack">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nama Batch</th>
                  <th scope="col">Sumber</th>
                  <th scope="col" className="text-end">Jumlah Data</th>
                  <th scope="col">Status</th>
                  <th scope="col">Dibuat</th>
                  <th scope="col" className="text-end">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr key={d.id}>
                    <td className="num fw-bold">#{d.id}</td>
                    <td className="cell-main">
                      <span className="fw-semibold">{d.batch_name || d.name}</span>
                      {d.dataset_description && (
                        <span className="cell-sub text-truncate" style={{ maxWidth: 260 }}>
                          {d.dataset_description}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {d.source_type || 'csv'}
                      </span>
                    </td>
                    <td className="num text-end fw-semibold">
                      {d.total_rows || d.record_count || 0}
                    </td>
                    <td>
                      <span
                        className={`status status-${
                          d.status === 'imported' || d.status === 'validated'
                            ? 'success'
                            : d.status === 'processing'
                              ? 'warning'
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
                          onClick={() => handleOpenDetail(d)}
                        >
                          Info (Pop-Up)
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/datasets/${d.id}`)}
                        >
                          Buka Data
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/datasets/${d.id}/import`)}
                        >
                          Upload CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {datasets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      Belum ada batch dataset. Buat batch pertama Anda untuk mulai mengimpor data.
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </section>

      {/* POPUP MODAL: Buat Batch Baru */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        title="Buat Batch Dataset Baru"
        subtitle="Alokasikan wadah batch dataset pendaftar beasiswa"
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
              form="createBatchForm"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan Batch'}
            </button>
          </div>
        }
      >
        <form id="createBatchForm" onSubmit={handleCreate}>
          <div className="mb-3">
            <label className="form-label" htmlFor="batchName">
              Nama Batch Dataset *
            </label>
            <input
              id="batchName"
              type="text"
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Seleksi Beasiswa Prestasi 2026/2027"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="batchDesc">
              Deskripsi / Catatan Periode
            </label>
            <textarea
              id="batchDesc"
              rows={3}
              className="form-control"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Catatan tambahan mengenai gelombang pendaftaran atau syarat khusus"
            />
          </div>
        </form>
      </Modal>

      {/* POPUP MODAL: Info Detail Batch */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        size="md"
        title={`Informasi Batch #${selectedBatch?.id || ''}`}
        subtitle={selectedBatch?.batch_name || selectedBatch?.name}
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
        {selectedBatch && (
          <div>
            <div className="p-3 mb-3 bg-light rounded border">
              <span className="text-muted small d-block">Status Batch</span>
              <span className="fw-bold fs-5 text-success">{selectedBatch.status.toUpperCase()}</span>
            </div>
            <ul className="list-group list-group-flush border rounded small mb-3">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Total Baris Mahasiswa</span>
                <span className="fw-bold font-monospace">{selectedBatch.total_rows || selectedBatch.record_count || 0} Data</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Tipe Sumber Data</span>
                <span className="badge bg-secondary">{selectedBatch.source_type || 'csv'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Nama File Sumber</span>
                <span className="text-truncate text-muted" style={{ maxWidth: 200 }}>
                  {selectedBatch.source_filename || 'Input Manual / Seed'}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Waktu Dibuat</span>
                <span>{selectedBatch.created_at ? new Date(selectedBatch.created_at).toLocaleString('id-ID') : '-'}</span>
              </li>
            </ul>
            {selectedBatch.dataset_description && (
              <div className="p-3 bg-light rounded border small">
                <strong>Deskripsi:</strong> {selectedBatch.dataset_description}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
