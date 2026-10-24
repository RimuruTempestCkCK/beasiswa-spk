import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function TrainingPage() {
  const [clusteringRuns, setClusteringRuns] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedClustering, setSelectedClustering] = useState('');
  const [config, setConfig] = useState({
    hidden_layers: '64,32',
    learning_rate: 0.001,
    max_epochs: 100,
    test_size: 0.2,
    random_seed: 42,
    activation: 'relu',
  });
  const [training, setTraining] = useState(false);
  const pollingRef = useRef(null);

  const fetchModels = useCallback(() => {
    apiClient
      .get(API.MODELS.LIST)
      .then((res) => {
        const items = res.data.items || res.data || [];
        setModels(items);
        const hasRunning = items.some(
          (m) => m.status === 'training' || m.status === 'queued'
        );
        if (hasRunning && !pollingRef.current) {
          pollingRef.current = setInterval(fetchModels, 2500);
        } else if (!hasRunning && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiClient
      .get(API.CLUSTERING.RUNS, { params: { is_selected: true } })
      .then((res) => {
        const items = res.data.items || res.data || [];
        setClusteringRuns(items);
        if (items.length > 0) setSelectedClustering(items[0].id);
      })
      .catch(() => {});
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleTrain = async (e) => {
    e.preventDefault();
    if (!selectedClustering)
      return toast.warning('Pilih clustering run terpilih sebagai target label');
    setTraining(true);
    try {
      await apiClient.post(API.MODELS.TRAIN, {
        clustering_run_id: parseInt(selectedClustering),
        hidden_layers: config.hidden_layers
          .split(',')
          .map((v) => parseInt(v.trim()))
          .filter(Boolean),
        learning_rate: parseFloat(config.learning_rate),
        max_epochs: parseInt(config.max_epochs),
        test_size: parseFloat(config.test_size),
        random_seed: parseInt(config.random_seed),
        activation: config.activation,
      });
      toast.success('Proses pelatihan Backpropagation dimulai!');
      fetchModels();
      if (!pollingRef.current) pollingRef.current = setInterval(fetchModels, 2500);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memulai pelatihan model');
    } finally {
      setTraining(false);
    }
  };

  const handleSetReady = async (modelId) => {
    try {
      await apiClient.post(API.MODELS.SET_READY(modelId));
      toast.success('Model berhasil diset aktif (Ready) untuk inferensi!');
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengaktifkan status model');
    }
  };

  const handleArchive = async (modelId) => {
    try {
      await apiClient.post(API.MODELS.ARCHIVE(modelId));
      toast.info('Model telah diarsipkan.');
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengarsipkan model');
    }
  };

  return (
    <>
      <PageTitle
        heading="Pelatihan Model Backpropagation"
        subheading="Latih jaringan saraf tiruan (Multi-Layer Perceptron) menggunakan label klaster acuan"
        eyebrow="Model &amp; Analisis · SPK Beasiswa"
      />

      <div className="row g-3 g-xxl-4 mb-4">
        {/* Left Form */}
        <div className="col-lg-4">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Parameter Jaringan Saraf</h2>
                <p className="panel-sub">Arsitektur dan hyperparameter Backprop</p>
              </div>
            </div>
            <div className="panel-body">
              <form onSubmit={handleTrain}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="clusteringSelect">
                    Target Label (Clustering Terpilih) *
                  </label>
                  <select
                    id="clusteringSelect"
                    className="form-select"
                    value={selectedClustering}
                    onChange={(e) => setSelectedClustering(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Clustering Run Acuan --</option>
                    {clusteringRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        Run #{r.id} - K={r.k || r.k_value} (DBI: {r.dbi_score ? Number(r.dbi_score).toFixed(4) : '-'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="hiddenLayers">
                    Hidden Layer Neurons (pisahkan koma)
                  </label>
                  <input
                    id="hiddenLayers"
                    type="text"
                    className="form-control"
                    value={config.hidden_layers}
                    onChange={(e) =>
                      setConfig({ ...config, hidden_layers: e.target.value })
                    }
                    placeholder="Contoh: 64, 32"
                    required
                  />
                  <div className="form-text">
                    Format: 64,32 menghasilkan 2 lapisan tersembunyi.
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="learningRate">
                      Learning Rate
                    </label>
                    <input
                      id="learningRate"
                      type="number"
                      step="0.0001"
                      min="0.00001"
                      className="form-control"
                      value={config.learning_rate}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          learning_rate: parseFloat(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="maxEpochs">
                      Maksimal Epoch
                    </label>
                    <input
                      id="maxEpochs"
                      type="number"
                      min="10"
                      max="2000"
                      className="form-control"
                      value={config.max_epochs}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          max_epochs: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <label className="form-label" htmlFor="activationFunc">
                      Fungsi Aktivasi
                    </label>
                    <select
                      id="activationFunc"
                      className="form-select"
                      value={config.activation}
                      onChange={(e) =>
                        setConfig({ ...config, activation: e.target.value })
                      }
                    >
                      <option value="relu">ReLU (Rekomendasi)</option>
                      <option value="logistic">Sigmoid (Logistic)</option>
                      <option value="tanh">Tanh (Hiperbolik)</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="testSize">
                      Porsi Data Uji
                    </label>
                    <select
                      id="testSize"
                      className="form-select"
                      value={config.test_size}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          test_size: parseFloat(e.target.value),
                        })
                      }
                    >
                      <option value="0.2">20% Uji / 80% Latih</option>
                      <option value="0.3">30% Uji / 70% Latih</option>
                      <option value="0.1">10% Uji / 90% Latih</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={training}
                >
                  {training ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Melatih Jaringan Saraf...
                    </>
                  ) : (
                    'Mulai Pelatihan Model'
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Right Table */}
        <div className="col-lg-8">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Daftar Versi Model</h2>
                <p className="panel-sub">Artefak model Backpropagation dan status kesiapan</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchModels}
              >
                Refresh
              </button>
            </div>

            {models.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-muted mb-0">Belum ada model Backpropagation yang dilatih.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table-data table-stack">
                  <thead>
                    <tr>
                      <th scope="col">Versi</th>
                      <th scope="col">Nama / Arsitektur</th>
                      <th scope="col" className="text-end">Akurasi Uji</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.id}>
                        <td className="num fw-bold">v{m.model_version || m.version || m.id}</td>
                        <td className="cell-main">
                          <span className="fw-semibold">{m.model_name || `Model #${m.id}`}</span>
                          <span className="cell-sub">
                            Lapisan: {m.hidden_layers ? (Array.isArray(m.hidden_layers) ? m.hidden_layers.join('-') : m.hidden_layers) : '-'} · Aktivasi: {m.activation || 'relu'}
                          </span>
                        </td>
                        <td className="num text-end">
                          {m.accuracy !== undefined && m.accuracy !== null
                            ? `${(Number(m.accuracy) * 100).toFixed(2)}%`
                            : '-'}
                        </td>
                        <td>
                          <span
                            className={`status status-${
                              m.status === 'ready'
                                ? 'success'
                                : m.status === 'training'
                                  ? 'warning'
                                  : m.status === 'archived'
                                    ? 'neutral'
                                    : 'neutral'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            {m.status !== 'ready' && m.status !== 'training' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleSetReady(m.id)}
                              >
                                Set Ready
                              </button>
                            )}
                            {m.status === 'ready' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleArchive(m.id)}
                              >
                                Arsipkan
                              </button>
                            )}
                          </div>
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
