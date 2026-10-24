import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function PreprocessingPage() {
  const [datasets, setDatasets] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [config, setConfig] = useState({
    missing_strategy: 'median',
    normalization: 'minmax',
  });
  const [running, setRunning] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    apiClient
      .get(API.DATASETS.LIST)
      .then((res) => setDatasets(res.data.items || res.data || []))
      .catch(() => {});
    fetchRuns();
  }, []);

  const fetchRuns = () => {
    setLoading(true);
    apiClient
      .get(API.PREPROCESSING.RUNS)
      .then((res) => {
        const items = res.data.items || res.data || [];
        setRuns(items);
        const hasRunning = items.some(
          (r) => r.status === 'running' || r.status === 'queued'
        );
        if (hasRunning && !pollingRef.current) {
          pollingRef.current = setInterval(fetchRuns, 2500);
        } else if (!hasRunning && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      })
      .catch(() => toast.error('Gagal memuat daftar preprocessing'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!selectedDataset) return toast.warn('Pilih dataset terlebih dahulu');
    setRunning(true);
    try {
      await apiClient.post(API.PREPROCESSING.RUNS, {
        dataset_id: parseInt(selectedDataset),
        ...config,
      });
      toast.success('Preprocessing job berhasil dimulai!');
      fetchRuns();
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchRuns, 2500);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memulai preprocessing');
    } finally {
      setRunning(false);
    }
  };

  const handleOpenDetail = (run) => {
    setSelectedRun(run);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <PageTitle
        heading="Preprocessing Data"
        subheading="Tahap pembersihan data hilang (imputasi) dan normalisasi fitur mahasiswa"
        eyebrow="Model &amp; Analisis · SPK Beasiswa"
      />

      <div className="row g-3 g-xxl-4">
        {/* Left Column: Form */}
        <div className="col-lg-4">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Konfigurasi Preprocessing</h2>
                <p className="panel-sub">Pilih parameter normalisasi data</p>
              </div>
            </div>
            <div className="panel-body">
              <form onSubmit={handleRun}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="datasetSelect">
                    Dataset Batch *
                  </label>
                  <select
                    id="datasetSelect"
                    className="form-select"
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Dataset Batch --</option>
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.batch_name || d.name} ({d.total_rows || d.record_count || 0} data)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="missingStrategy">
                    Strategi Penanganan Missing Values
                  </label>
                  <select
                    id="missingStrategy"
                    className="form-select"
                    value={config.missing_strategy}
                    onChange={(e) =>
                      setConfig({ ...config, missing_strategy: e.target.value })
                    }
                  >
                    <option value="median">Imputasi Nilai Median (Rekomendasi Akademik)</option>
                    <option value="mean">Imputasi Nilai Rata-rata (Mean)</option>
                    <option value="drop">Abaikan Baris Missing (Drop)</option>
                  </select>
                  <div className="form-text">
                    Median tahan terhadap nilai ekstrem (outlier) sosio-ekonomi.
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="normMethod">
                    Metode Normalisasi Fitur
                  </label>
                  <select
                    id="normMethod"
                    className="form-select"
                    value={config.normalization}
                    onChange={(e) =>
                      setConfig({ ...config, normalization: e.target.value })
                    }
                  >
                    <option value="minmax">MinMaxScaler [0, 1] (Wajib K-Means)</option>
                    <option value="zscore">Z-Score Standardization</option>
                  </select>
                  <div className="form-text">
                    Menyamakan rentang 6 indikator (IPK, Penghasilan, Tanggungan, Prestasi, Kehadiran).
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={running || datasets.length === 0}
                >
                  {running ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Memproses Preprocessing...
                    </>
                  ) : (
                    'Mulai Preprocessing Dataset'
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Right Column: Runs Table */}
        <div className="col-lg-8">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Riwayat Preprocessing Runs</h2>
                <p className="panel-sub">Log normalisasi dataset (klik detail untuk melihat pop-up parameter)</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchRuns}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            {runs.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-muted mb-0">Belum ada riwayat proses preprocessing.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table-data table-stack">
                  <thead>
                    <tr>
                      <th scope="col">Run ID</th>
                      <th scope="col">Dataset</th>
                      <th scope="col" className="text-end">
                        Baris Masuk
                      </th>
                      <th scope="col" className="text-end">
                        Baris Keluar
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr key={r.id}>
                        <td className="num fw-bold">#{r.id}</td>
                        <td className="cell-main">
                          {r.dataset_name || `Dataset #${r.dataset_id}`}
                        </td>
                        <td className="num text-end">{r.input_rows ?? '-'}</td>
                        <td className="num text-end">{r.output_rows ?? '-'}</td>
                        <td>
                          <span
                            className={`status status-${
                              r.status === 'completed'
                                ? 'success'
                                : r.status === 'running'
                                  ? 'warning'
                                  : r.status === 'failed'
                                    ? 'danger'
                                    : 'neutral'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenDetail(r)}
                          >
                            Detail (Pop-Up)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* POPUP MODAL: Detail Preprocessing Run */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        size="md"
        title={`Detail Preprocessing Run #${selectedRun?.id || ''}`}
        subtitle={`Dataset: ${selectedRun?.dataset_name || `ID #${selectedRun?.dataset_id || ''}`}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsDetailModalOpen(false)}
          >
            Tutup
          </button>
        }
      >
        {selectedRun && (
          <div>
            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Status Pekerjaan</span>
                <span className={`fw-bold text-${selectedRun.status === 'completed' ? 'success' : 'secondary'}`}>
                  {selectedRun.status.toUpperCase()}
                </span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Data Bersih Siap Klaster</span>
                <span className="fs-5 fw-bold text-primary font-monospace">
                  {selectedRun.output_rows ?? 0} Record
                </span>
              </div>
            </div>

            <h6 className="fw-bold text-primary mb-2">Parameter &amp; Statistik Preprocessing:</h6>
            <ul className="list-group list-group-flush border rounded mb-3 small">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Metode Normalisasi</span>
                <span className="badge bg-primary font-monospace">{selectedRun.normalization_method || selectedRun.normalization || 'minmax'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Strategi Imputasi Missing</span>
                <span className="fw-semibold">{selectedRun.missing_strategy || 'median'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Total Baris Masuk (Input)</span>
                <span className="font-monospace">{selectedRun.input_rows ?? '-'} Baris</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Baris Dihapus / Outlier</span>
                <span className="font-monospace text-danger">{(selectedRun.input_rows || 0) - (selectedRun.output_rows || 0)} Baris</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Waktu Pemrosesan</span>
                <span>{selectedRun.created_at ? new Date(selectedRun.created_at).toLocaleString('id-ID') : '-'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Path Artefak Scaler</span>
                <span className="font-monospace text-truncate text-muted" style={{ maxWidth: 220 }}>
                  {selectedRun.artifact_path || '-'}
                </span>
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
