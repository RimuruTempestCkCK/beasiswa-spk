import { useEffect, useState, useRef, useCallback } from 'react';
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
import Modal from '../../components/Modal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pollingRef = useRef(null);

  const fetchRuns = useCallback(() => {
    apiClient
      .get(API.CLUSTERING.RUNS)
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiClient
      .get(API.PREPROCESSING.RUNS, { params: { status: 'completed' } })
      .then((res) => {
        const items = res.data.items || res.data || [];
        setPrepRuns(items);
        if (items.length > 0) setSelectedPrep(items[0].id);
      })
      .catch(() => {});
    fetchRuns();
  }, [fetchRuns]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!selectedPrep) return toast.warning('Pilih preprocessing run terlebih dahulu');
    const kArr = kValues
      .split(',')
      .map((v) => parseInt(v.trim()))
      .filter(Boolean);
    if (kArr.length === 0) return toast.warning('Masukkan nilai K yang valid');

    setRunning(true);
    try {
      await apiClient.post(API.CLUSTERING.RUNS, {
        preprocessing_run_id: parseInt(selectedPrep),
        k_values: kArr,
        random_seed: parseInt(seed),
      });
      toast.success('Clustering job berhasil dimulai untuk K = ' + kArr.join(', '));
      fetchRuns();
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchRuns, 2500);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memulai clustering');
    } finally {
      setRunning(false);
    }
  };

  const handleSelectRun = async (run) => {
    setSelectedRun(run);
    setIsModalOpen(true);
    try {
      const res = await apiClient.get(API.CLUSTERING.DETAIL(run.id));
      setProfile(res.data.profile || res.data.cluster_profiles || []);
      setAssignments(res.data.assignments || res.data.sample_assignments || []);
    } catch {
      toast.error('Gagal memuat detail profil klaster');
    }
  };

  const handleSetSelected = async (runId) => {
    setSelecting(true);
    try {
      await apiClient.post(API.CLUSTERING.SELECT(runId));
      toast.success('Clustering run terpilih berhasil dijadikan acuan pelatihan model!');
      fetchRuns();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menetapkan model acuan');
    } finally {
      setSelecting(false);
    }
  };

  const completedRuns = runs
    .filter((r) => r.status === 'completed' && r.dbi_score !== null && r.dbi_score !== undefined)
    .sort((a, b) => (a.k || a.k_value) - (b.k || b.k_value));

  const chartData = {
    labels: completedRuns.map((r) => `K = ${r.k || r.k_value} (Run #${r.id})`),
    datasets: [
      {
        label: 'Davies-Bouldin Index (Semakin Kecil Semakin Baik)',
        data: completedRuns.map((r) => Number(r.dbi_score).toFixed(4)),
        backgroundColor: completedRuns.map((r) =>
          r.is_selected ? 'rgba(23, 112, 63, 0.85)' : 'rgba(14, 94, 97, 0.75)'
        ),
        borderColor: completedRuns.map((r) =>
          r.is_selected ? 'var(--rg-good)' : 'var(--rg-primary)'
        ),
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => `Skor DBI: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Nilai Davies-Bouldin Index' },
      },
    },
  };

  return (
    <>
      <PageTitle
        heading="K-Means Clustering &amp; Evaluasi DBI"
        subheading="Eksperimen klasterisasi dataset berdasarkan 6 parameter dengan pemilihan K optimal via Davies-Bouldin Index"
        eyebrow="Model &amp; Analisis · SPK Beasiswa"
      />

      <div className="row g-3 g-xxl-4 mb-4">
        {/* Form Run */}
        <div className="col-lg-4">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Parameter Eksperimen K-Means</h2>
                <p className="panel-sub">Tentukan variasi jumlah klaster (K)</p>
              </div>
            </div>
            <div className="panel-body">
              <form onSubmit={handleRun}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="prepSelect">
                    Preprocessing Run *
                  </label>
                  <select
                    id="prepSelect"
                    className="form-select"
                    value={selectedPrep}
                    onChange={(e) => setSelectedPrep(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Preprocessing Run --</option>
                    {prepRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        Run #{r.id} - {r.dataset_name || `Dataset #${r.dataset_id}`} ({r.output_rows} data)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="kValues">
                    Kandidat Nilai K (pisahkan koma)
                  </label>
                  <input
                    id="kValues"
                    type="text"
                    className="form-control"
                    value={kValues}
                    onChange={(e) => setKValues(e.target.value)}
                    placeholder="Contoh: 2, 3, 4"
                    required
                  />
                  <div className="form-text">
                    Algoritma akan menguji setiap K dan menghitung skor DBI.
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="seed">
                    Random Seed
                  </label>
                  <input
                    id="seed"
                    type="number"
                    className="form-control"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                  <div className="form-text">
                    Menjaga konsistensi inisialisasi centroid awal.
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
                      Memproses Clustering...
                    </>
                  ) : (
                    'Jalankan Eksperimen K-Means'
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Right Chart */}
        <div className="col-lg-8">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Perbandingan Davies-Bouldin Index (DBI)</h2>
                <p className="panel-sub">
                  Evaluasi kualitas clustering antar kandidat nilai K (Nilai terendah = Paling optimal)
                </p>
              </div>
            </div>
            <div className="panel-body" style={{ minHeight: 300 }}>
              {completedRuns.length > 0 ? (
                <div style={{ height: 300 }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">
                    Belum ada eksperimen clustering yang selesai. Jalankan konfigurasi di sebelah kiri.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Clustering Runs Table */}
      <section className="panel mb-4">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Daftar Hasil Eksperimen Clustering</h2>
            <p className="panel-sub">Klik Detail untuk membuka popup profil klaster dan sampel data</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table-data table-stack">
            <thead>
              <tr>
                <th scope="col">ID Run</th>
                <th scope="col">Prep ID</th>
                <th scope="col" className="text-end">K</th>
                <th scope="col" className="text-end">Skor DBI</th>
                <th scope="col">Status</th>
                <th scope="col">Model Acuan</th>
                <th scope="col" className="text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="num fw-bold">#{r.id}</td>
                  <td className="num">#{r.preprocessing_run_id}</td>
                  <td className="num text-end">{r.k || r.k_value}</td>
                  <td className="num text-end">
                    {r.dbi_score !== null && r.dbi_score !== undefined
                      ? Number(r.dbi_score).toFixed(4)
                      : '-'}
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
                  <td>
                    {r.is_selected ? (
                      <span className="badge bg-success-subtle text-success border border-success fw-bold">
                        Terpilih (Acuan)
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleSelectRun(r)}
                      >
                        Lihat Detail (Pop-Up)
                      </button>
                      {!r.is_selected && r.status === 'completed' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSetSelected(r.id)}
                          disabled={selecting}
                        >
                          Pilih Acuan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Belum ada riwayat clustering run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* POPUP MODAL: Cluster Profile & Assignments */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        title={`Profil Karakteristik Klaster Run #${selectedRun?.id || ''}`}
        subtitle={`Kandidat Nilai K = ${selectedRun?.k || selectedRun?.k_value || '-'} · DBI: ${selectedRun?.dbi_score ? Number(selectedRun.dbi_score).toFixed(4) : '-'}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsModalOpen(false)}
          >
            Tutup
          </button>
        }
      >
        {profile.length > 0 ? (
          <div className="mb-4">
            <h6 className="fw-bold mb-3 text-primary">Rata-rata Nilai Variabel Tiap Klaster:</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle text-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Klaster</th>
                    <th scope="col" className="text-end">Rata-rata IPK</th>
                    <th scope="col" className="text-end">Penghasilan Ortu</th>
                    <th scope="col" className="text-end">Tanggungan</th>
                    <th scope="col" className="text-end">Prestasi Akad.</th>
                    <th scope="col" className="text-end">Prestasi Non-Akad.</th>
                    <th scope="col" className="text-end">Kehadiran</th>
                    <th scope="col" className="text-end">Jumlah Mhs</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.map((p, i) => (
                    <tr key={i}>
                      <td className="fw-bold">
                        <span className="badge bg-primary-subtle text-primary border me-1">
                          C{p.cluster_label ?? i}
                        </span>
                        Klaster {p.cluster_label ?? i}
                      </td>
                      <td className="text-end font-monospace">{p.mean_ipk !== undefined ? Number(p.mean_ipk).toFixed(2) : '-'}</td>
                      <td className="text-end font-monospace">{p.mean_income !== undefined ? `Rp ${Number(p.mean_income).toLocaleString('id-ID')}` : '-'}</td>
                      <td className="text-end font-monospace">{p.mean_dependents !== undefined ? Number(p.mean_dependents).toFixed(1) : '-'}</td>
                      <td className="text-end font-monospace">{p.mean_academic !== undefined ? Number(p.mean_academic).toFixed(1) : '-'}</td>
                      <td className="text-end font-monospace">{p.mean_nonacademic !== undefined ? Number(p.mean_nonacademic).toFixed(1) : '-'}</td>
                      <td className="text-end font-monospace">{p.mean_attendance !== undefined ? `${Number(p.mean_attendance).toFixed(1)}%` : '-'}</td>
                      <td className="text-end fw-bold text-success">{p.count ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted">Data profil klaster sedang dimuat atau tidak tersedia.</div>
        )}

        {assignments.length > 0 && (
          <div>
            <h6 className="fw-bold mb-3 text-primary">Sampel Penetapan Klaster Mahasiswa:</h6>
            <div className="table-responsive" style={{ maxHeight: 320 }}>
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th scope="col">Kode / NIM</th>
                    <th scope="col">Nama Mahasiswa</th>
                    <th scope="col">Klaster Ditugaskan</th>
                    <th scope="col" className="text-end">Jarak Euclidean ke Centroid</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, idx) => (
                    <tr key={idx}>
                      <td className="font-monospace text-muted small">{a.nim || a.student_code || a.student_nim || `#${idx + 1}`}</td>
                      <td className="fw-semibold">{a.nama || a.student_name || 'Mahasiswa'}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info border">
                          Klaster {a.cluster ?? a.cluster_label}
                        </span>
                      </td>
                      <td className="text-end font-monospace small">
                        {a.distance !== undefined && a.distance !== null
                          ? Number(a.distance).toFixed(4)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
