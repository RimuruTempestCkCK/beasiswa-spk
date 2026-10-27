import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function TrainingPage() {
  const [clusteringRuns, setClusteringRuns] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedClustering, setSelectedClustering] = useState('');
  const [config, setConfig] = useState({
    hidden_layers: '64, 32',
    learning_rate: '0.001',
    max_iter: '500',
    activation: 'relu',
    test_size: '0.2',
    random_state: '42',
  });
  const [training, setTraining] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchClusteringRuns();
    fetchModels();
  }, []);

  const fetchClusteringRuns = async () => {
    try {
      const res = await apiClient.get(API.CLUSTERING.RUNS, {
        params: { status: 'completed' },
      });
      const items = res.data.items || res.data || [];
      setClusteringRuns(items);
      const sel = items.find((r) => r.is_selected);
      if (sel) {
        setSelectedClustering(sel.id);
      } else if (items.length > 0) {
        setSelectedClustering(items[0].id);
      }
    } catch {
      toast.error('Gagal memuat daftar clustering run');
    }
  };

  const fetchModels = async () => {
    try {
      const res = await apiClient.get(API.MODELS.LIST);
      setModels(res.data.items || res.data || []);
    } catch {
      toast.error('Gagal memuat daftar model');
    }
  };

  const handleTrain = async (e) => {
    e.preventDefault();
    if (!selectedClustering) {
      toast.warning('Pilih clustering run acuan terlebih dahulu');
      return;
    }
    setTraining(true);

    const layers = config.hidden_layers
      .split(',')
      .map((v) => parseInt(v.trim()))
      .filter((v) => !isNaN(v) && v > 0);

    const payload = {
      model_name: `MLP (${layers.join('-')})`,
      model_version: `v${models.length + 1}.0`,
      clustering_run_id: parseInt(selectedClustering),
      hidden_layer_sizes: layers.length > 0 ? layers : [64, 32],
      learning_rate_init: parseFloat(config.learning_rate) || 0.001,
      max_iter: parseInt(config.max_iter) || 500,
      activation: config.activation || 'relu',
      test_size: parseFloat(config.test_size) || 0.2,
      random_state: parseInt(config.random_state) || 42,
    };

    try {
      await apiClient.post(API.MODELS.TRAIN, payload);
      toast.success('Pelatihan model Backpropagation berhasil diselesaikan!');
      fetchModels();
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

  const handleOpenDetail = (model) => {
    setSelectedModel(model);
    setIsDetailModalOpen(true);
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
        <div className="col-lg-5">
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
                    Jumlah neuron tiap lapisan tersembunyi (contoh: 64, 32).
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="learningRate">
                      Learning Rate
                    </label>
                    <input
                      id="learningRate"
                      type="number"
                      step="0.0001"
                      className="form-control"
                      value={config.learning_rate}
                      onChange={(e) =>
                        setConfig({ ...config, learning_rate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="maxIter">
                      Maksimal Epoch
                    </label>
                    <input
                      id="maxIter"
                      type="number"
                      className="form-control"
                      value={config.max_iter}
                      onChange={(e) =>
                        setConfig({ ...config, max_iter: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label" htmlFor="activationSelect">
                      Fungsi Aktivasi
                    </label>
                    <select
                      id="activationSelect"
                      className="form-select"
                      value={config.activation}
                      onChange={(e) =>
                        setConfig({ ...config, activation: e.target.value })
                      }
                    >
                      <option value="relu">ReLU</option>
                      <option value="logistic">Sigmoid (Logistic)</option>
                      <option value="tanh">Tanh</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="splitSelect">
                      Pembagian Data
                    </label>
                    <select
                      id="splitSelect"
                      className="form-select"
                      value={config.test_size}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          test_size: e.target.value,
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
        <div className="col-lg-7">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Daftar Versi Model</h2>
                <p className="panel-sub">Model Backpropagation dan status aktif</p>
              </div>
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
                      <th scope="col">Nama / Lapisan</th>
                      <th scope="col" className="text-end">Akurasi</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.id}>
                        <td className="num fw-bold">v{(m.model_version || m.version || `${m.id}`).replace(/^v+/, '')}</td>
                        <td className="cell-main">
                          <span className="fw-semibold">{m.model_name || `Model #${m.id}`}</span>
                        </td>
                        <td className="num text-end">
                          {m.accuracy !== undefined && m.accuracy !== null
                            ? `${(Number(m.accuracy) * 100).toFixed(1)}%`
                            : m.metrics?.accuracy !== undefined && m.metrics?.accuracy !== null
                              ? `${(Number(m.metrics.accuracy) * 100).toFixed(1)}%`
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
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleOpenDetail(m)}
                            >
                              Detail
                            </button>
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

      {/* POPUP MODAL: Detail Parameter Model */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        size="md"
        title={`Konfigurasi & Detail Model v${selectedModel?.model_version || selectedModel?.version || ''}`}
        subtitle={`ID Model #${selectedModel?.id || ''} · Dibuat: ${selectedModel?.created_at ? new Date(selectedModel.created_at).toLocaleString('id-ID') : '-'}`}
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
        {selectedModel && (
          <div>
            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Status Model</span>
                <span className={`fw-bold text-${selectedModel.status === 'ready' ? 'success' : 'secondary'}`}>
                  {selectedModel.status.toUpperCase()}
                </span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Akurasi Pengujian</span>
                <span className="fs-5 fw-bold text-primary font-monospace">
                  {selectedModel.accuracy ? `${(Number(selectedModel.accuracy) * 100).toFixed(2)}%` : '-'}
                </span>
              </div>
            </div>

            <h6 className="fw-bold text-primary mb-2">Hyperparameter &amp; Konfigurasi:</h6>
            <ul className="list-group list-group-flush border rounded mb-3 small">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Nama Model</span>
                <span className="fw-semibold">{selectedModel.model_name || `Model #${selectedModel.id}`}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Target Klaster Run Acuan</span>
                <span className="badge bg-secondary font-monospace">Run #{selectedModel.target_clustering_run_id || selectedModel.clustering_run_id}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Algoritma</span>
                <span className="fw-semibold">{selectedModel.algorithm || 'Backpropagation (MLP)'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Arsitektur Lapisan Tersembunyi</span>
                <span className="font-monospace">
                  {selectedModel.hidden_layers
                    ? (Array.isArray(selectedModel.hidden_layers) ? selectedModel.hidden_layers.join(' - ') : selectedModel.hidden_layers)
                    : (selectedModel.training_config?.hidden_layer_sizes?.join(' - ') || '64 - 32')}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Fungsi Aktivasi</span>
                <span className="font-monospace">{selectedModel.activation || selectedModel.training_config?.activation || 'relu'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Learning Rate Init</span>
                <span className="font-monospace">{selectedModel.training_config?.learning_rate_init || '0.001'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Maksimal Epoch</span>
                <span className="font-monospace">{selectedModel.training_config?.max_iter || '500'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Path Artefak Model</span>
                <span className="font-monospace text-truncate text-muted" style={{ maxWidth: 220 }}>
                  {selectedModel.artifact_path || '-'}
                </span>
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
