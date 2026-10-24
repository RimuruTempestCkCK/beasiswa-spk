import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import CountUp from 'react-countup';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <PageTitle
        heading="Dashboard Analitik"
        subheading="Ringkasan dataset, eksperimen clustering K-Means, dan model Backpropagation"
        eyebrow="Overview · SPK Beasiswa"
        actions={
          <>
            <Link to="/datasets" className="btn btn-outline-secondary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6M22 11h-6" />
              </svg>
              <span>Batch Dataset</span>
            </Link>
            <Link to="/predictions" className="btn btn-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <span>Prediksi Cepat</span>
            </Link>
          </>
        }
      />

      {/* Analytical decision disclaimer banner */}
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
          <strong>Pemberitahuan Rekomendasi Analitis:</strong> Sistem ini menyajikan hasil rekomendasi kelayakan berbasis pola data historis (K-Means &amp; Backpropagation). Keputusan resmi penerimaan beasiswa tetap berada pada wewenang pihak kampus / pengelola setelah verifikasi persyaratan dan otorisasi sah.
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: '2.5rem', height: '2.5rem' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Memuat data dashboard...</p>
        </div>
      ) : (
        <>
          {/* Key Figures / KPI Grid */}
          <section className="kpi-grid mb-4" aria-label="Ringkasan Indikator Utama">
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-teal">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <p className="kpi-label">Total Batch Dataset</p>
              </div>
              <p className="kpi-value">
                <CountUp start={0} end={totalBatches} duration={1.5} />
              </p>
              <p className="kpi-note">Batch berkas pendaftaran tersimpan</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-green">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                  </svg>
                </span>
                <p className="kpi-label">Total Data Mahasiswa</p>
              </div>
              <p className="kpi-value">
                <CountUp start={0} end={totalRecords} separator="." duration={1.5} />
              </p>
              <p className="kpi-note">Rekod pendaftar terdata</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-amber">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </span>
                <p className="kpi-label">Eksperimen Clustering</p>
              </div>
              <p className="kpi-value">
                <CountUp start={0} end={totalClustering} duration={1.5} />
              </p>
              <p className="kpi-note">Uji coba K-Means &amp; evaluasi DBI</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-slate">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                  </svg>
                </span>
                <p className="kpi-label">Model Aktif (Ready)</p>
              </div>
              <p className="kpi-value">
                <CountUp start={0} end={activeModels} duration={1.5} />
              </p>
              <p className="kpi-note">Model Backpropagation teruji siap pakai</p>
            </div>
          </section>

          {/* Panels for Recent Batches and Recent Models */}
          <div className="row g-3 g-xxl-4">
            <div className="col-xl-6">
              <section className="panel h-100" aria-labelledby="batchTitle">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title" id="batchTitle">
                      Batch Dataset Terbaru
                    </h2>
                    <p className="panel-sub">Daftar batch data mahasiswa yang baru diimpor</p>
                  </div>
                  <Link className="link-arrow" to="/datasets">
                    Lihat semua{' '}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
                <div className="table-wrap">
                  <table className="table-data table-stack">
                    <thead>
                      <tr>
                        <th scope="col">Nama Batch</th>
                        <th scope="col" className="text-end">
                          Jumlah Data
                        </th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBatches.length > 0 ? (
                        recentBatches.map((b) => (
                          <tr key={b.id}>
                            <td className="cell-main">
                              <Link
                                to={`/datasets/${b.id}`}
                                className="fw-semibold text-decoration-none"
                              >
                                {b.batch_name || b.name}
                              </Link>
                              {b.description && (
                                <span className="cell-sub">{b.description}</span>
                              )}
                            </td>
                            <td className="num text-end">
                              {(b.total_rows ?? b.record_count ?? 0).toLocaleString('id-ID')}
                            </td>
                            <td>
                              <span
                                className={`status status-${
                                  b.status === 'validated'
                                    ? 'success'
                                    : b.status === 'imported'
                                      ? 'info'
                                      : b.status === 'rejected'
                                        ? 'danger'
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
                            Belum ada dataset batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="col-xl-6">
              <section className="panel h-100" aria-labelledby="modelTitle">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title" id="modelTitle">
                      Model Backpropagation Terbaru
                    </h2>
                    <p className="panel-sub">Versi model jaringan saraf tiruan hasil pelatihan</p>
                  </div>
                  <Link className="link-arrow" to="/training">
                    Kelola model{' '}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
                <div className="table-wrap">
                  <table className="table-data table-stack">
                    <thead>
                      <tr>
                        <th scope="col">Versi Model</th>
                        <th scope="col" className="text-end">
                          Akurasi Uji
                        </th>
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
                              {m.model_name && (
                                <span className="cell-sub">{m.model_name}</span>
                              )}
                            </td>
                            <td className="num text-end">
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
                            Belum ada model yang dilatih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
