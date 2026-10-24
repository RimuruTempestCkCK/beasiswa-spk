import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(() => {
    setLoading(true);
    apiClient
      .get(API.REPORTS.EXPERIMENTS)
      .then((res) => setReport(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportPredictions = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${baseUrl}${API.REPORTS.EXPORT_PREDICTIONS}`, '_blank');
  };

  return (
    <>
      <PageTitle
        heading="Laporan &amp; Riwayat Eksperimen"
        subheading="Ringkasan audit eksperimen data mining dan ekspor hasil inferensi calon beasiswa"
        eyebrow="Prediksi &amp; Laporan · SPK Beasiswa"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportPredictions}
          >
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>Ekspor Prediksi (CSV)</span>
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: '2.5rem', height: '2.5rem' }}
          />
          <p className="text-muted mt-2">Memuat laporan eksperimen...</p>
        </div>
      ) : (
        <div className="row g-3 g-xxl-4">
          {/* Clustering Runs Table */}
          <div className="col-lg-6">
            <section className="panel h-100">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Eksperimen Clustering K-Means</h2>
                  <p className="panel-sub">Riwayat pengujian cluster dan evaluasi DBI</p>
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
                      <th scope="col">Terpilih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report?.clusters?.map((c) => (
                      <tr key={c.id}>
                        <td className="num fw-bold">#{c.id}</td>
                        <td className="num">#{c.preprocessing_run_id}</td>
                        <td className="num text-end">{c.k_value || c.k}</td>
                        <td className="num text-end">
                          {c.dbi_score !== null && c.dbi_score !== undefined
                            ? Number(c.dbi_score).toFixed(4)
                            : '-'}
                        </td>
                        <td>
                          <span
                            className={`status status-${
                              c.status === 'completed' ? 'success' : 'neutral'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td>
                          {c.is_selected ? (
                            <span className="badge bg-success-subtle text-success border border-success">
                              Ya
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!report?.clusters || report.clusters.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          Belum ada clustering run tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Model Backpropagation Table */}
          <div className="col-lg-6">
            <section className="panel h-100">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Versi Model Backpropagation</h2>
                  <p className="panel-sub">Daftar model terlatih dan performa akurasi</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table-data table-stack">
                  <thead>
                    <tr>
                      <th scope="col">Versi</th>
                      <th scope="col">Nama Model</th>
                      <th scope="col">Target Cluster</th>
                      <th scope="col" className="text-end">Akurasi</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report?.models?.map((m) => (
                      <tr key={m.id}>
                        <td className="num fw-bold">v{m.version || m.model_version || m.id}</td>
                        <td className="cell-main">
                          <span className="fw-semibold">{m.name || m.model_name || `Model #${m.id}`}</span>
                        </td>
                        <td>Run #{m.target_clustering_run_id || m.clustering_run_id || '-'}</td>
                        <td className="num text-end">
                          {m.metrics?.accuracy !== undefined && m.metrics.accuracy !== null
                            ? `${(Number(m.metrics.accuracy) * 100).toFixed(1)}%`
                            : m.accuracy !== undefined && m.accuracy !== null
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
                    ))}
                    {(!report?.models || report.models.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Belum ada model Backpropagation tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
