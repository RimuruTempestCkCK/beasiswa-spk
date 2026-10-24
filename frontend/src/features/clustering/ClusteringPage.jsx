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
      toast.success('Clustering job K-Means berhasil dimulai!');
      fetchRuns();
      if (!pollingRef.current) pollingRef.current = setInterval(fetchRuns, 2500);
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
      setAssignments(aRes.data.items || aRes.data || []);
      setProfile(pRes.data || []);
    } catch {
      toast.error('Gagal memuat rincian assignment clustering');
    }
  };

  const handleSetSelected = async (runId) => {
    setSelecting(true);
    try {
      await apiClient.post(API.CLUSTERING.SELECT(runId));
      toast.success('Clustering run ini dipilih sebagai target pelatihan Backpropagation!');
      fetchRuns();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memilih clustering run');
    } finally {
      setSelecting(false);
    }
  };

  // DBI Chart Data
  const completedRuns = runs.filter((r) => r.status === 'completed');
  const chartData = {
    labels: completedRuns.map((r) => `K=${r.k || r.k_value} (#${r.id})`),
    datasets: [
      {
        label: 'Davies-Bouldin Index (DBI)',
        data: completedRuns.map((r) => r.dbi_score),
        backgroundColor: completedRuns.map((r) =>
          r.is_selected ? 'rgba(23, 112, 63, 0.85)' : 'rgba(14, 94, 97, 0.75)'
        ),
        borderColor: completedRuns.map((r) =>
          r.is_selected ? '#17703f' : '#0e5e61'
        ),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Perbandingan Nilai DBI (Nilai lebih kecil menunjukkan kualitas cluster lebih baik)',
      },
    },
    scales: {
      y: { beginAtZero: false },
    },
  };

  return (
    <>
      <PageTitle
        heading="Clustering K-Means &amp; Evaluasi DBI"
        subheading="Eksperimen pengelompokan pendaftar beasiswa dan seleksi K optimal dengan Davies-Bouldin Index"
        eyebrow="Model &amp; Analisis · SPK Beasiswa"
      />

      {/* Analytical disclaimer banner */}
      <div
        className="alert alert-info d-flex align-items-center gap-3 mb-4"
        role="alert"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 24, height: 24, flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <strong>Disclaimer Pengelompokan Data:</strong> Label cluster yang dihasilkan algoritma K-Means merupakan representasi pola kesamaan karakteristik dalam dataset, bukan penetapan kelayakan beasiswa definitif. Hasil ini digunakan sebagai label target pelatihan model Backpropagation.
        </div>
      </div>

      <div className="row g-3 g-xxl-4 mb-4">
        {/* Left Form */}
        <div className="col-lg-4">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Konfigurasi K-Means</h2>
                <p className="panel-sub">Tentukan kandidat K dan data input</p>
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
                  Evaluasi kualitas clustering antar kandidat nilai K
                </p>
              </div>
            </div>
            <div className="panel-body">
              {completedRuns.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
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
            <p className="panel-sub">Pilih run terbaik untuk dijadikan acuan pelatihan model</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchRuns}
          >
            Refresh
          </button>
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
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleSelectRun(r)}
                      >
                        Detail Cluster
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

      {/* Selected Cluster Details */}
      {selectedRun && (
        <section className="panel mb-4">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">
                Profil Klaster Run #{selectedRun.id} (K={selectedRun.k || selectedRun.k_value})
              </h2>
              <p className="panel-sub">Karakteristik rata-rata tiap klaster</p>
            </div>
          </div>
          <div className="panel-body">
            {profile.length > 0 ? (
              <div className="table-wrap mb-4">
                <table className="table-data table-compact">
                  <thead>
                    <tr>
                      <th scope="col">Klaster</th>
                      <th scope="col" className="text-end">Rata-rata IPK</th>
                      <th scope="col" className="text-end">Rata-rata Gaji Ortu</th>
                      <th scope="col" className="text-end">Tanggungan</th>
                      <th scope="col" className="text-end">Prestasi Akad.</th>
                      <th scope="col" className="text-end">Prestasi Non-Akad.</th>
                      <th scope="col" className="text-end">Kehadiran</th>
                      <th scope="col" className="text-end">Jumlah Mahasiswa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.map((p, i) => (
                      <tr key={i}>
                        <td className="cell-main fw-bold">
                          Klaster {p.cluster_label ?? i}
                        </td>
                        <td className="num text-end">
                          {p.mean_ipk !== undefined ? Number(p.mean_ipk).toFixed(2) : '-'}
                        </td>
                        <td className="num text-end">
                          {p.mean_income !== undefined
                            ? `Rp ${Number(p.mean_income).toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="num text-end">
                          {p.mean_dependents !== undefined ? Number(p.mean_dependents).toFixed(1) : '-'}
                        </td>
                        <td className="num text-end">
                          {p.mean_academic !== undefined ? Number(p.mean_academic).toFixed(1) : '-'}
                        </td>
                        <td className="num text-end">
                          {p.mean_nonacademic !== undefined ? Number(p.mean_nonacademic).toFixed(1) : '-'}
                        </td>
                        <td className="num text-end">
                          {p.mean_attendance !== undefined ? `${Number(p.mean_attendance).toFixed(1)}%` : '-'}
                        </td>
                        <td className="num text-end fw-semibold">
                          {p.count ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {assignments.length > 0 && (
              <div>
                <h3 className="h6 fw-bold mb-2">Sampel Assignment Mahasiswa</h3>
                <div className="table-wrap">
                  <table className="table-data table-compact">
                    <thead>
                      <tr>
                        <th scope="col">NIM</th>
                        <th scope="col">Nama Mahasiswa</th>
                        <th scope="col">Klaster Ditugaskan</th>
                        <th scope="col" className="text-end">Jarak ke Centroid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.slice(0, 10).map((a, idx) => (
                        <tr key={idx}>
                          <td className="num">{a.nim || a.student_nim || `#${idx + 1}`}</td>
                          <td className="cell-main">{a.nama || a.student_name || '-'}</td>
                          <td>
                            <span className="status status-info">
                              Klaster {a.cluster ?? a.cluster_label}
                            </span>
                          </td>
                          <td className="num text-end">
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
          </div>
        </section>
      )}
    </>
  );
}
