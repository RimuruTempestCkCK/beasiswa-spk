import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

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
                    <option value="">-- Pilih Dataset --</option>
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.record_count ?? 0} data)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="missingStrategy">
                    Strategi Nilai Hilang (Missing Value)
                  </label>
                  <select
                    id="missingStrategy"
                    className="form-select"
                    value={config.missing_strategy}
                    onChange={(e) =>
                      setConfig({ ...config, missing_strategy: e.target.value })
                    }
                  >
                    <option value="median">Median (Rekomendasi numerik)</option>
                    <option value="mean">Mean (Rata-rata)</option>
                    <option value="mode">Modus (Nilai terbanyak)</option>
                    <option value="drop">Drop (Hapus baris)</option>
                  </select>
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
                    <option value="minmax">Min-Max Scaler [0, 1]</option>
                    <option value="standard">Standard Scaler (Z-Score)</option>
                  </select>
                  <div className="form-text">
                    Min-Max disarankan untuk keseragaman skala 6 variabel SPK.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={running}
                >
                  {running ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Memproses...
                    </>
                  ) : (
                    'Jalankan Preprocessing'
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
                <p className="panel-sub">Log eksekusi normalisasi dataset yang telah dilakukan</p>
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
                      <th scope="col">Normalisasi</th>
                      <th scope="col">Status</th>
                      <th scope="col">Waktu</th>
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
                          <span className="badge bg-secondary-subtle text-secondary border">
                            {r.normalization_method || r.normalization || 'minmax'}
                          </span>
                        </td>
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
                        <td className="num">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
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
    </>
  );
}
