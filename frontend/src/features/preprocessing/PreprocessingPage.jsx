import { useEffect, useState, useRef } from 'react';
import { Card, CardBody, Button, FormGroup, Label, Input, Badge } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

const STATUS_COLOR = {
  queued: 'secondary',
  running: 'warning',
  completed: 'success',
  failed: 'danger',
};

export default function PreprocessingPage() {
  const [datasets, setDatasets] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [config, setConfig] = useState({ missing_strategy: 'median', normalization: 'minmax' });
  const [running, setRunning] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    apiClient.get(API.DATASETS.LIST).then((res) => setDatasets(res.data.items || res.data));
    fetchRuns();
  }, []);

  const fetchRuns = () => {
    setLoading(true);
    apiClient
      .get(API.PREPROCESSING.RUNS)
      .then((res) => {
        const items = res.data.items || res.data;
        setRuns(items);
        // Check if any are running
        const hasRunning = items.some((r) => r.status === 'running' || r.status === 'queued');
        if (hasRunning && !pollingRef.current) {
          pollingRef.current = setInterval(fetchRuns, 2000);
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
      toast.success('Preprocessing job dimulai!');
      fetchRuns();
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchRuns, 2000);
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
        subheading="Bersihkan dan normalisasi data mahasiswa"
        icon="pe-7s-settings icon-gradient bg-mean-fruit"
      />
      <div className="row">
        <div className="col-md-4">
          <Card>
            <CardBody>
              <h5 className="card-title">Konfigurasi Preprocessing</h5>
              <form onSubmit={handleRun}>
                <FormGroup>
                  <Label>Dataset Batch *</Label>
                  <Input
                    type="select"
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Dataset --</option>
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Penanganan Missing Value</Label>
                  <Input
                    type="select"
                    value={config.missing_strategy}
                    onChange={(e) => setConfig({ ...config, missing_strategy: e.target.value })}
                  >
                    <option value="median">Median</option>
                    <option value="mean">Mean</option>
                    <option value="drop">Drop Row</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Metode Normalisasi</Label>
                  <Input
                    type="select"
                    value={config.normalization}
                    onChange={(e) => setConfig({ ...config, normalization: e.target.value })}
                  >
                    <option value="minmax">Min-Max</option>
                    <option value="standard">Standard (Z-Score)</option>
                  </Input>
                </FormGroup>
                <Button type="submit" color="primary" className="w-100" disabled={running}>
                  {running ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Memproses...</>
                  ) : (
                    <><i className="pe-7s-play3 me-2" />Jalankan Preprocessing</>
                  )}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
        <div className="col-md-8">
          <Card>
            <CardBody>
              <h5 className="card-title">Riwayat Preprocessing</h5>
              {loading && runs.length === 0 ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
              ) : runs.length === 0 ? (
                <div className="alert alert-info">Belum ada preprocessing run.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Dataset</th>
                        <th>Strategi</th>
                        <th>Normalisasi</th>
                        <th>Input Rows</th>
                        <th>Output Rows</th>
                        <th>Status</th>
                        <th>Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((r, idx) => (
                        <tr key={r.id}>
                          <td>{idx + 1}</td>
                          <td>{r.dataset_name || r.dataset_id}</td>
                          <td>{r.missing_strategy}</td>
                          <td>{r.normalization}</td>
                          <td>{r.input_rows ?? '-'}</td>
                          <td>{r.output_rows ?? '-'}</td>
                          <td>
                            <Badge color={STATUS_COLOR[r.status] || 'secondary'}>
                              {r.status}
                              {(r.status === 'running' || r.status === 'queued') && (
                                <span className="spinner-border spinner-border-sm ms-2" style={{ width: '0.75rem', height: '0.75rem' }} />
                              )}
                            </Badge>
                          </td>
                          <td>{r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '-'}</td>
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
