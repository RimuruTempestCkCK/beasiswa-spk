import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import CountUp from 'react-countup';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useSelector((s) => s.auth?.user);
  const userRole = user?.role || 'operator';
  const isAdmin = userRole === 'admin';
  const isOperator = userRole === 'operator';
  const isReviewer = userRole === 'reviewer';

  useEffect(() => {
    apiClient
      .get(API.DASHBOARD.SUMMARY)
      .then((res) => setSummary(res.data))
      .catch(() => toast.error('Gagal memuat ringkasan dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const totalBatches = summary?.kpis?.total_batches ?? summary?.total_datasets ?? 0;
  const totalRecords = summary?.kpis?.total_records ?? summary?.total_records ?? 0;
  const totalClustering = summary?.kpis?.total_clustering_experiments ?? summary?.total_clustering_runs ?? 0;
  const activeModels = summary?.kpis?.active_ready_models ?? summary?.active_models ?? 0;

  const recentBatches = summary?.latest_batches || summary?.recent_datasets || [];
  const recentModels = summary?.latest_models || summary?.recent_models || [];

  // Konfigurasi Heading sesuai Role
  let pageHeading = 'Dashboard Analitik Sistem';
  let pageSubheading = 'Ringkasan operasional dan evaluasi analitik SPK Beasiswa';
  if (isAdmin) {
    pageHeading = 'Dashboard Administrator';
    pageSubheading = 'Pengawasan menyeluruh dataset, integritas model machine learning, dan manajemen sistem';
  } else if (isOperator) {
    pageHeading = 'Dashboard Operasional Data & Model';
    pageSubheading = 'Status pemrosesan batch dataset pendaftar, eksperimen K-Means, dan kesiapan model';
  } else if (isReviewer) {
    pageHeading = 'Dashboard Penelaah (Reviewer)';
    pageSubheading = 'Ringkasan data calon beasiswa, ketersediaan model validasi, dan laporan rekomendasi';
  }

  return (
    <>
      <PageTitle
        heading={pageHeading}
        subheading={pageSubheading}
        eyebrow={`Peran: ${userRole.toUpperCase()} · SPK Beasiswa`}
      />

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Memuat data dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI TILES SESUAI ROLE */}
          <section className="kpi-grid mb-4" aria-label="Ringkasan Indikator Utama">
            {/* Tile 1: Total Batch Dataset (Semua Role) */}
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <p className="kpi-label">Batch Dataset</p>
              </div>
              <p className="kpi-value">
                <CountUp start={0} end={totalBatches} duration={1.2} />
              </p>
              <p className="kpi-note">Koleksi berkas periode tersimpan</p>
            </div>

            {/* Tile 2: Total Data Mahasiswa (Semua Role) */}
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                  </svg>
                </span>
                <p className="kpi-label">Total Mahasiswa</p>
              </div>
              <p className="kpi-value">
                <CountUp start={0} end={totalRecords} separator="." duration={1.2} />
              </p>
              <p className="kpi-note">Pendaftar calon beasiswa terdata</p>
            </div>

            {/* Tile 3: Eksperimen K-Means (Admin & Operator) atau Status Verifikasi (Reviewer) */}
            {!isReviewer ? (
              <div className="kpi">
                <div className="kpi-top">
                  <span className="kpi-icon tone-amber">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </span>
                  <p className="kpi-label">Eksperimen K-Means</p>
                </div>
                <p className="kpi-value">
                  <CountUp start={0} end={totalClustering} duration={1.2} />
                </p>
                <p className="kpi-note">Uji coba partisi &amp; skor DBI</p>
              </div>
            ) : (
              <div className="kpi">
                <div className="kpi-top">
                  <span className="kpi-icon tone-amber">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                  </span>
                  <p className="kpi-label">Laporan Rekomendasi</p>
                </div>
                <p className="kpi-value">Tersedia</p>
                <p className="kpi-note">Siap ditelaah &amp; diekspor</p>
              </div>
            )}

            {/* Tile 4: Status Model Aktif (Semua Role) */}
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-slate">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                  </svg>
                </span>
                <p className="kpi-label">Model Aktif (Ready)</p>
              </div>
              <p className="kpi-value">
                <CountUp start={0} end={activeModels} duration={1.2} />
              </p>
              <p className="kpi-note">{activeModels > 0 ? 'Siap inferensi penilaian' : 'Belum diaktifkan'}</p>
            </div>
          </section>

          {/* DETAIL PANELS SESUAI ROLE */}
          <div className="row g-3 g-xxl-4">
            {/* Panel Kiri: Batch Dataset Terdaftar */}
            <div className={isReviewer ? 'col-12' : 'col-xl-6'}>
              <section className="panel h-100" aria-labelledby="batchTitle">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title" id="batchTitle">
                      Batch Dataset Pendaftar
                    </h2>
                    <p className="panel-sub">Daftar periode pendaftaran calon penerima beasiswa</p>
                  </div>
                  <Link className="link-arrow" to="/datasets">
                    Buka data{' '}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
                <div className="table-wrap">
                  <table className="table-data table-stack">
                    <thead>
                      <tr>
                        <th scope="col">Nama Batch</th>
                        <th scope="col" className="text-end">Jumlah Mahasiswa</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBatches.length > 0 ? (
                        recentBatches.map((b) => (
                          <tr key={b.id}>
                            <td className="cell-main">
                              <Link to={`/datasets/${b.id}`} className="fw-semibold text-decoration-none">
                                {b.batch_name || b.name}
                              </Link>
                              {b.description && <span className="cell-sub">{b.description}</span>}
                            </td>
                            <td className="num text-end">
                              {(b.total_rows ?? b.record_count ?? 0).toLocaleString('id-ID')}
                            </td>
                            <td>
                              <span
                                className={`status status-${
                                  b.status === 'validated' || b.status === 'imported'
                                    ? 'success'
                                    : b.status === 'processing'
                                      ? 'warning'
                                      : 'neutral'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">
                            Belum ada batch dataset tersimpan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Panel Kanan: Model Backpropagation (Hanya tampil untuk Admin dan Operator) */}
            {!isReviewer && (
              <div className="col-xl-6">
                <section className="panel h-100" aria-labelledby="modelTitle">
                  <div className="panel-head">
                    <div>
                      <h2 className="panel-title" id="modelTitle">
                        Model Backpropagation Terlatih
                      </h2>
                      <p className="panel-sub">Arsip performa jaringan saraf tiruan</p>
                    </div>
                    <Link className="link-arrow" to="/training">
                      Kelola model{' '}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                  <div className="table-wrap">
                    <table className="table-data table-stack">
                      <thead>
                        <tr>
                          <th scope="col">Versi Model</th>
                          <th scope="col" className="text-end">Akurasi Uji</th>
                          <th scope="col">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentModels.length > 0 ? (
                          recentModels.map((m) => (
                            <tr key={m.id}>
                              <td className="cell-main">
                                <span className="fw-semibold">
                                  {m.model_version || m.version || `Model #${m.id}`}
                                </span>
                                {m.model_name && <span className="cell-sub">{m.model_name}</span>}
                              </td>
                              <td className="num text-end font-monospace">
                                {m.accuracy !== null && m.accuracy !== undefined
                                  ? `${(Number(m.accuracy) * 100).toFixed(1)}%`
                                  : '-'}
                              </td>
                              <td>
                                <span
                                  className={`status status-${
                                    m.status === 'ready'
                                      ? 'success'
                                      : m.status === 'training'
                                        ? 'warning'
                                        : 'neutral'
                                  }`}
                                >
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center text-muted py-4">
                              Belum ada model Backpropagation yang dilatih.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
