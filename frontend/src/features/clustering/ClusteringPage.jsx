import { useEffect, useState, useRef } from 'react';
import { Card, CardBody, Button, FormGroup, Label, Input, Badge, Alert } from 'reactstrap';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const STATUS_COLOR = { queued: 'secondary', running: 'warning', completed: 'success', failed: 'danger' };

export default function ClusteringPage() {
  const [prepRuns, setPrepRuns] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedPrep, setSelectedPrep] = useState('');
  const [kValues, setKValues] = useState('2,3,4');
  const [seed, setSeed] = useState(42);
  const [selectedRun, setSelectedRun] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [profile, setProfile] = useState([]);
  const [running, setRunning] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    apiClient
      .get(API.PREPROCESSING.RUNS, { params: { status: 'completed' } })
      .then((res) => setPrepRuns(res.data.items || res.data));
    fetchRuns();
  }, []);

  const fetchRuns = () => {
    apiClient
      .get(API.CLUSTERING.RUNS)
      .then((res) => {
        const items = res.data.items || res.data;
        setRuns(items);
        const hasRunning = items.some((r) => r.status === 'running' || r.status === 'queued');
        if (hasRunning && !pollingRef.current) {
          pollingRef.current = setInterval(fetchRuns, 2000);
        } else if (!hasRunning && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      })
      .catch(() => {});
  };

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!selectedPrep) return toast.warn('Pilih preprocessing run');
    const kArr = kValues.split(',').map((v) => parseInt(v.trim())).filter(Boolean);
    if (kArr.length === 0) return toast.warn('Masukkan nilai K yang valid');
    setRunning(true);
    try {
      await apiClient.post(API.CLUSTERING.RUNS, {
        preprocessing_run_id: parseInt(selectedPrep),
        k_values: kArr,
        random_seed: parseInt(seed),
      });
      toast.success('Clustering job dimulai!');
      fetchRuns();
      if (!pollingRef.current) pollingRef.current = setInterval(fetchRuns, 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memulai clustering');
    } finally {
      setRunning(false);
    }
  };

  const handleSelectRun = async (run) => {
    setSelectedRun(run);
    try {
      const [aRes, pRes] = await Promise.all([
        apiClient.get(API.CLUSTERING.ASSIGNMENTS(run.id)),
        apiClient.get(API.CLUSTERING.PROFILE(run.id)),
      ]);
      setAssignments(aRes.data.items || aRes.data);
      setProfile(pRes.data || []);
    } catch {
      toast.error('Gagal memuat detail clustering');
    }
  };

  const handleSetSelected = async (runId) => {
    setSelecting(true);
    try {
      await apiClient.post(API.CLUSTERING.SELECT(runId));
      toast.success('Clustering run dipilih sebagai acuan!');
      fetchRuns();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memilih clustering run');
    } finally {
      setSelecting(false);
    }
  };

  // Chart data for DBI comparison
  const completedRuns = runs.filter((r) => r.status === 'completed');
  const chartData = {
    labels: completedRuns.map((r) => `K=${r.k} (Run #${r.id})`),
    datasets: [
      {
        label: 'Davies-Bouldin Index',
        data: completedRuns.map((r) => r.dbi_score),
        backgroundColor: completedRuns.map((r) =>
          r.is_selected ? 'rgba(40, 167, 69, 0.8)' : 'rgba(0, 123, 255, 0.7)'
        ),
        borderColor: completedRuns.map((r) =>
          r.is_selected ? 'rgba(40, 167, 69, 1)' : 'rgba(0, 123, 255, 1)'
        ),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Perbandingan DBI per K (lebih kecil = lebih baik)' },
    },
    scales: { y: { beginAtZero: false } },
  };

  return (
    <>
      <PageTitle
        heading="Clustering K-Means"
        subheading="Kelompokkan mahasiswa berdasarkan fitur"
        icon="pe-7s-target icon-gradient bg-mean-fruit"
      />

      <Alert color="info" className="mb-3">
        <i className="pe-7s-info me-2" />
        <strong>Disclaimer:</strong> Label yang dihasilkan adalah label cluster berbasis pola data, bukan keputusan resmi kelayakan beasiswa.
      </Alert>

      <div className="row">
        <div className="col-md-4">
          <Card>
            <CardBody>
              <h5>Konfigurasi Clustering</h5>
              <form onSubmit={handleRun}>
                <FormGroup>
                  <Label>Preprocessing Run *</Label>
                  <Input type="select" value={selectedPrep} onChange={(e) => setSelectedPrep(e.target.value)} required>
                    <option value="">-- Pilih Preprocessing Run --</option>
                    {prepRuns.map((r) => (
                      <option key={r.id} value={r.id}>Run #{r.id} - {r.dataset_name || r.dataset_id} ({r.output_rows} rows)</option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Kandidat K (pisahkan koma, e.g. 2,3,4)</Label>
                  <Input
                    type="text"
                    value={kValues}
                    onChange={(e) => setKValues(e.target.value)}
                    placeholder="2,3,4"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Random Seed</Label>
                  <Input type="number" value={seed} onChange={(e) => setSeed(e.target.value)} />
                </FormGroup>
                <Button type="submit" color="primary" className="w-100" disabled={running}>
                  {running ? <><span className="spinner-border spinner-border-sm me-2" />Memproses...</> : 'Jalankan Clustering'}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="col-md-8">
          <Card className="mb-3">
            <CardBody>
              <h5>Perbandingan DBI</h5>
              {completedRuns.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <p className="text-muted">Belum ada clustering run yang selesai.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h5>Daftar Clustering Run</h5>
              {runs.length === 0 ? (
                <div className="alert alert-info">Belum ada clustering run.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>K</th>
                        <th>DBI</th>
                        <th>Status</th>
                        <th>Dipilih</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((r, idx) => (
                        <tr key={r.id} className={r.is_selected ? 'table-success' : ''}>
                          <td>{idx + 1}</td>
                          <td>{r.k}</td>
                          <td>{r.dbi_score != null ? r.dbi_score.toFixed(4) : '-'}</td>
                          <td>
                            <Badge color={STATUS_COLOR[r.status] || 'secondary'}>
                              {r.status}
                              {(r.status === 'running' || r.status === 'queued') && (
                                <span className="spinner-border spinner-border-sm ms-1" style={{ width: '0.75rem', height: '0.75rem' }} />
                              )}
                            </Badge>
                          </td>
                          <td>{r.is_selected ? <Badge color="success">Ya</Badge> : '-'}</td>
                          <td>
                            {r.status === 'completed' && (
                              <>
                                <Button size="sm" color="info" className="me-1" onClick={() => handleSelectRun(r)}>
                                  Detail
                                </Button>
                                {!r.is_selected && (
                                  <Button size="sm" color="success" onClick={() => handleSetSelected(r.id)} disabled={selecting}>
                                    Pilih
                                  </Button>
                                )}
                              </>
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

      {selectedRun && (
        <>
          <Card className="mt-3">
            <CardBody>
              <h5>Distribusi Cluster - Run #{selectedRun.id} (K={selectedRun.k})</h5>
              {profile.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Cluster</th>
                        <th>Jumlah Anggota</th>
                        <th>IPK (mean)</th>
                        <th>Penghasilan Ortu (mean)</th>
                        <th>Tanggungan (mean)</th>
                        <th>Prestasi Akademik (mean)</th>
                        <th>Prestasi Non-Akademik (mean)</th>
                        <th>Kehadiran % (mean)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.map((c) => (
                        <tr key={c.cluster_id}>
                          <td><Badge color="primary">Cluster {c.cluster_id}</Badge></td>
                          <td>{c.size}</td>
                          <td>{c.ipk_mean?.toFixed(2) ?? '-'}</td>
                          <td>{c.penghasilan_ortu_mean?.toLocaleString('id-ID') ?? '-'}</td>
                          <td>{c.jumlah_tanggungan_mean?.toFixed(1) ?? '-'}</td>
                          <td>{c.skor_prestasi_akademik_mean?.toFixed(1) ?? '-'}</td>
                          <td>{c.skor_prestasi_nonakademik_mean?.toFixed(1) ?? '-'}</td>
                          <td>{c.persentase_kehadiran_mean?.toFixed(1) ?? '-'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Tidak ada profil cluster.</p>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
