import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClusteringRun, setSelectedClusteringRun] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

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

  const clusteringRuns = report?.clustering_runs || [];
  const models = report?.models || [];

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
                  <h2 className="panel-title">Riwayat Eksperimen K-Means</h2>
                  <p className="panel-sub">Evaluasi Davies-Bouldin Index (DBI)</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table-data table-compact">
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col" className="text-end">K</th>
                      <th scope="col" className="text-end">DBI</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clusteringRuns.map((r) => (
                      <tr key={r.id}>
                        <td className="num fw-bold">#{r.id}</td>
                        <td className="num text-end">{r.k_value || r.k}</td>
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
                                : r.status === 'failed'
                                  ? 'danger'
                                  : 'neutral'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedClusteringRun(r)}
                          >
                            Detail (Pop-Up)
                          </button>
                        </td>
                      </tr>
                    ))}
                    {clusteringRuns.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Belum ada riwayat eksperimen clustering.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Model Versions Table */}
          <div className="col-lg-6">
            <section className="panel h-100">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Riwayat Model Backpropagation</h2>
                  <p className="panel-sub">Versi model Multi-Layer Perceptron (MLP)</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table-data table-compact">
                  <thead>
                    <tr>
                      <th scope="col">Versi</th>
                      <th scope="col" className="text-end">Akurasi</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.id}>
                        <td className="num fw-bold">v{m.model_version || m.version || m.id}</td>
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
                                  : 'neutral'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedModel(m)}
                          >
                            Detail (Pop-Up)
                          </button>
                        </td>
                      </tr>
                    ))}
                    {models.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          Belum ada model Backpropagation yang dilatih.
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

      {/* POPUP MODAL: Detail Clustering Run */}
      <Modal
        isOpen={!!selectedClusteringRun}
        onClose={() => setSelectedClusteringRun(null)}
        size="md"
        title={`Audit Clustering Run #${selectedClusteringRun?.id || ''}`}
        subtitle={`Kandidat K = ${selectedClusteringRun?.k_value || selectedClusteringRun?.k || '-'}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedClusteringRun(null)}
          >
            Tutup
          </button>
        }
      >
        {selectedClusteringRun && (
          <div>
            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Status Eksperimen</span>
                <span className="fw-bold text-success">{selectedClusteringRun.status.toUpperCase()}</span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Skor DBI</span>
                <span className="fs-5 fw-bold text-primary font-monospace">
                  {selectedClusteringRun.dbi_score ? Number(selectedClusteringRun.dbi_score).toFixed(4) : '-'}
                </span>
              </div>
            </div>
            <ul className="list-group list-group-flush border rounded small">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Preprocessing Run Acuan</span>
                <span className="badge bg-secondary font-monospace">Run #{selectedClusteringRun.preprocessing_run_id}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Algoritma</span>
                <span className="fw-semibold">{selectedClusteringRun.algorithm || 'K-Means'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Random Seed</span>
                <span className="font-monospace">{selectedClusteringRun.random_seed || '42'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Model Acuan Terpilih</span>
                <span>{selectedClusteringRun.is_selected ? 'Ya (Model Acuan)' : 'Bukan'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Waktu Dijalankan</span>
                <span>{selectedClusteringRun.created_at ? new Date(selectedClusteringRun.created_at).toLocaleString('id-ID') : '-'}</span>
              </li>
            </ul>
          </div>
        )}
      </Modal>

      {/* POPUP MODAL: Detail Model Run */}
      <Modal
        isOpen={!!selectedModel}
        onClose={() => setSelectedModel(null)}
        size="md"
        title={`Audit Model v${selectedModel?.model_version || selectedModel?.version || ''}`}
        subtitle={`ID Model #${selectedModel?.id || ''}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedModel(null)}
          >
            Tutup
          </button>
        }
      >
        {selectedModel && (
          <div>
            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Status Kesiapan</span>
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
            <ul className="list-group list-group-flush border rounded small">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Nama Model</span>
                <span className="fw-semibold">{selectedModel.model_name || `Model #${selectedModel.id}`}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Clustering Run Asal</span>
                <span className="badge bg-secondary font-monospace">Run #{selectedModel.target_clustering_run_id || selectedModel.clustering_run_id}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Algoritma</span>
                <span className="fw-semibold">Backpropagation MLP</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Macro Precision</span>
                <span className="font-monospace">
                  {selectedModel.metrics?.precision_macro ? `${(Number(selectedModel.metrics.precision_macro) * 100).toFixed(2)}%` : '-'}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Macro Recall</span>
                <span className="font-monospace">
                  {selectedModel.metrics?.recall_macro ? `${(Number(selectedModel.metrics.recall_macro) * 100).toFixed(2)}%` : '-'}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Macro F1-Score</span>
                <span className="font-monospace">
                  {selectedModel.metrics?.f1_macro ? `${(Number(selectedModel.metrics.f1_macro) * 100).toFixed(2)}%` : '-'}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Waktu Pelatihan</span>
                <span>{selectedModel.created_at ? new Date(selectedModel.created_at).toLocaleString('id-ID') : '-'}</span>
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
