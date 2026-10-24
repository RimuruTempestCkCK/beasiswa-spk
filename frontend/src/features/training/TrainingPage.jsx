import { useEffect, useState, useRef } from 'react';
import { Card, CardBody, Button, FormGroup, Label, Input, Badge } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

const STATUS_COLOR = { queued: 'secondary', running: 'warning', completed: 'success', failed: 'danger', ready: 'primary', archived: 'dark' };

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

  useEffect(() => {
    apiClient
      .get(API.CLUSTERING.RUNS, { params: { is_selected: true } })
      .then((res) => setClusteringRuns(res.data.items || res.data));
    fetchModels();
  }, []);

  const fetchModels = () => {
    apiClient
      .get(API.MODELS.LIST)
      .then((res) => {
        const items = res.data.items || res.data;
        setModels(items);
        const hasRunning = items.some((m) => m.status === 'training' || m.status === 'queued');
        if (hasRunning && !pollingRef.current) {
          pollingRef.current = setInterval(fetchModels, 2000);
        } else if (!hasRunning && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      })
      .catch(() => {});
  };

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const handleTrain = async (e) => {
    e.preventDefault();
    if (!selectedClustering) return toast.warn('Pilih clustering run');
    setTraining(true);
    try {
      await apiClient.post(API.MODELS.TRAIN, {
        clustering_run_id: parseInt(selectedClustering),
        hidden_layers: config.hidden_layers.split(',').map((v) => parseInt(v.trim())).filter(Boolean),
        learning_rate: parseFloat(config.learning_rate),
        max_epochs: parseInt(config.max_epochs),
        test_size: parseFloat(config.test_size),
        random_seed: parseInt(config.random_seed),
        activation: config.activation,
      });
      toast.success('Training dimulai!');
      fetchModels();
      if (!pollingRef.current) pollingRef.current = setInterval(fetchModels, 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memulai training');
    } finally {
      setTraining(false);
    }
  };

  const handleSetReady = async (modelId) => {
    try {
      await apiClient.post(API.MODELS.SET_READY(modelId));
      toast.success('Model diset sebagai Ready!');
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengubah status model');
    }
  };

  const handleArchive = async (modelId) => {
    try {
      await apiClient.post(API.MODELS.ARCHIVE(modelId));
      toast.info('Model diarsipkan.');
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengarsipkan model');
    }
  };

  return (
    <>
      <PageTitle
        heading="Training Model"
        subheading="Latih model MLP berdasarkan hasil clustering"
        icon="pe-7s-cpu icon-gradient bg-mean-fruit"
      />
      <div className="row">
        <div className="col-md-4">
          <Card>
            <CardBody>
              <h5>Konfigurasi Training</h5>
              <form onSubmit={handleTrain}>
                <FormGroup>
                  <Label>Clustering Run *</Label>
                  <Input type="select" value={selectedClustering} onChange={(e) => setSelectedClustering(e.target.value)} required>
                    <option value="">-- Pilih Clustering Run --</option>
                    {clusteringRuns.map((r) => (
                      <option key={r.id} value={r.id}>Run #{r.id} - K={r.k} (DBI: {r.dbi_score?.toFixed(3)})</option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Hidden Layers (pisahkan koma, e.g. 64,32)</Label>
                  <Input type="text" value={config.hidden_layers} onChange={(e) => setConfig({ ...config, hidden_layers: e.target.value })} />
                </FormGroup>
                <FormGroup>
                  <Label>Learning Rate</Label>
                  <Input type="number" step="0.0001" value={config.learning_rate} onChange={(e) => setConfig({ ...config, learning_rate: e.target.value })} />
                </FormGroup>
                <FormGroup>
                  <Label>Max Epochs</Label>
                  <Input type="number" min="1" value={config.max_epochs} onChange={(e) => setConfig({ ...config, max_epochs: e.target.value })} />
                </FormGroup>
                <FormGroup>
                  <Label>Test Size Ratio (0.1–0.4)</Label>
                  <Input type="number" step="0.05" min="0.1" max="0.4" value={config.test_size} onChange={(e) => setConfig({ ...config, test_size: e.target.value })} />
                </FormGroup>
                <FormGroup>
                  <Label>Random Seed</Label>
                  <Input type="number" value={config.random_seed} onChange={(e) => setConfig({ ...config, random_seed: e.target.value })} />
                </FormGroup>
                <FormGroup>
                  <Label>Activation Function</Label>
                  <Input type="select" value={config.activation} onChange={(e) => setConfig({ ...config, activation: e.target.value })}>
                    <option value="relu">ReLU</option>
                    <option value="tanh">Tanh</option>
                    <option value="logistic">Logistic (Sigmoid)</option>
                  </Input>
                </FormGroup>
                <Button type="submit" color="primary" className="w-100" disabled={training}>
                  {training ? <><span className="spinner-border spinner-border-sm me-2" />Training...</> : 'Mulai Training'}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="col-md-8">
          <Card>
            <CardBody>
              <h5>Daftar Versi Model</h5>
              {models.length === 0 ? (
                <div className="alert alert-info">Belum ada model. Mulai training terlebih dahulu.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Versi</th>
                        <th>Akurasi</th>
                        <th>F1 Score</th>
                        <th>Status</th>
                        <th>Dibuat</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((m, idx) => (
                        <tr key={m.id} className={m.status === 'ready' ? 'table-success' : ''}>
                          <td>{idx + 1}</td>
                          <td>{m.version}</td>
                          <td>{m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : '-'}</td>
                          <td>{m.f1_score != null ? m.f1_score.toFixed(3) : '-'}</td>
                          <td>
                            <Badge color={STATUS_COLOR[m.status] || 'secondary'}>
                              {m.status}
                              {(m.status === 'training' || m.status === 'queued') && (
                                <span className="spinner-border spinner-border-sm ms-1" style={{ width: '0.75rem', height: '0.75rem' }} />
                              )}
                            </Badge>
                          </td>
                          <td>{m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID') : '-'}</td>
                          <td>
                            {m.status === 'completed' && (
                              <Button size="sm" color="success" className="me-1" onClick={() => handleSetReady(m.id)}>
                                Set Ready
                              </Button>
                            )}
                            {(m.status === 'ready' || m.status === 'completed') && (
                              <Button size="sm" color="secondary" onClick={() => handleArchive(m.id)}>
                                Arsipkan
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
