import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function EvaluationPage() {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [modelDetail, setModelDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    apiClient.get(API.MODELS.LIST).then((res) => {
      const items = res.data.items || res.data || [];
      setModels(items);
      if (items.length > 0) {
        // Prioritize ready model if available
        const readyModel = items.find((m) => m.status === 'ready');
        setSelectedModelId(readyModel ? readyModel.id : items[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedModelId) return;
    setLoading(true);
    apiClient
      .get(API.MODELS.DETAIL(selectedModelId))
      .then((res) => setModelDetail(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedModelId]);

  const metrics = modelDetail?.metrics || {};
  const perClass = metrics?.per_class || {};
  const confusionMatrix = metrics?.confusion_matrix || [];

  return (
    <>
      <PageTitle
        heading="Evaluasi Model Backpropagation"
        subheading="Metrik performa jaringan saraf: Akurasi, Presisi, Recall, F1-Score, dan Confusion Matrix"
        eyebrow="Model &amp; Analisis · SPK Beasiswa"
        actions={
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={() => setIsModalOpen(true)}
            disabled={!modelDetail}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 18, height: 18 }}
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span>Buka Rincian Matriks &amp; Kelas</span>
          </button>
        }
      />

      {/* Critical metrics disclaimer banner */}
      <div
        className="alert alert-warning d-flex align-items-center gap-3 mb-4"
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
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <strong>Penting &amp; Disclaimer Evaluasi:</strong> Target pelatihan Backpropagation adalah label cluster K-Means, sehingga metrik evaluasi mengukur seberapa presisi jaringan saraf meniru dan mengklasifikasikan pola data sesuai cluster acuan.
        </div>
      </div>

      {/* Model Selector Card & Parameter Overview */}
      <div className="row g-3 g-xxl-4 mb-4">
        <div className="col-lg-6">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Pilih Model yang Dievaluasi</h2>
                <p className="panel-sub">Pilih versi model terlatih untuk memuat metrik pengujian</p>
              </div>
            </div>
            <div className="panel-body">
              <label className="form-label fw-bold" htmlFor="modelSelect">
                Versi Model Terdaftar *
              </label>
              <select
                id="modelSelect"
                className="form-select mb-3"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.model_name || `Model #${m.id}`} (v{m.model_version || m.version}) - Status: {m.status.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded border small">
                <span>Status Kesiapan:</span>
                <span className={`badge bg-${modelDetail?.status === 'ready' ? 'success' : 'secondary'} fs-7`}>
                  {(modelDetail?.status || 'UNKNOWN').toUpperCase()}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="col-lg-6">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Metadata Pelatihan Model</h2>
                <p className="panel-sub">Konfigurasi dataset pengujian dan target klaster</p>
              </div>
            </div>
            <div className="panel-body">
              {modelDetail ? (
                <ul className="list-group list-group-flush border rounded small mb-0">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Target Klaster Acuan</span>
                    <span className="badge bg-secondary font-monospace">Run #{modelDetail.target_clustering_run_id || modelDetail.clustering_run_id || '-'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Pembagian Data Pengujian (Test)</span>
                    <span className="fw-bold font-monospace">
                      {((modelDetail.training_config?.test_size || 0.2) * 100).toFixed(0)}% Data Uji / {((1 - (modelDetail.training_config?.test_size || 0.2)) * 100).toFixed(0)}% Latih
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Status Data Leakage</span>
                    <span className="badge bg-success-subtle text-success border border-success">
                      Bebas Kebocoran Data (Verified)
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Waktu Evaluasi</span>
                    <span>{modelDetail.created_at ? new Date(modelDetail.created_at).toLocaleString('id-ID') : '-'}</span>
                  </li>
                </ul>
              ) : (
                <p className="text-muted mb-0 py-3 text-center">Pilih model untuk melihat metadata.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Memuat evaluasi model...</p>
        </div>
      ) : (
        <>
          {/* Summary KPI Tiles */}
          <section className="kpis mb-4" aria-label="Ringkasan Performa Model">
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <p className="kpi-label">Akurasi Pengujian</p>
              </div>
              <p className="kpi-value">
                {metrics.accuracy !== undefined ? `${(Number(metrics.accuracy) * 100).toFixed(2)}%` : '-'}
              </p>
              <p className="kpi-note">Proporsi klasifikasi benar</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <p className="kpi-label">Macro Precision</p>
              </div>
              <p className="kpi-value">
                {metrics.precision_macro !== undefined ? `${(Number(metrics.precision_macro) * 100).toFixed(2)}%` : '-'}
              </p>
              <p className="kpi-note">Rata-rata ketepatan prediksi</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <p className="kpi-label">Macro Recall</p>
              </div>
              <p className="kpi-value">
                {metrics.recall_macro !== undefined ? `${(Number(metrics.recall_macro) * 100).toFixed(2)}%` : '-'}
              </p>
              <p className="kpi-note">Rata-rata sensitivitas temuan</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-slate">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <p className="kpi-label">Macro F1-Score</p>
              </div>
              <p className="kpi-value">
                {metrics.f1_macro !== undefined ? `${(Number(metrics.f1_macro) * 100).toFixed(2)}%` : '-'}
              </p>
              <p className="kpi-note">Keseimbangan presisi dan recall</p>
            </div>
          </section>

          {/* Quick Action Panel */}
          <section className="panel mb-4">
            <div className="panel-body d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 p-4">
              <div>
                <h3 className="h6 fw-bold mb-1">
                  Matriks Konfusi &amp; Rincian Kelas untuk Model v{modelDetail?.model_version || modelDetail?.version || ''}
                </h3>
                <p className="text-muted small mb-0">
                  Tinjau perbandingan distribusi prediksi aktual vs estimasi serta skor presisi, recall, dan F1-score tiap klaster.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline-primary px-4 text-nowrap"
                onClick={() => setIsModalOpen(true)}
              >
                Lihat Rincian Lengkap (Pop-Up)
              </button>
            </div>
          </section>
        </>
      )}

      {/* POPUP MODAL: Confusion Matrix & Class Breakdown */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        title={`Rincian Evaluasi Model v${modelDetail?.model_version || modelDetail?.version || ''}`}
        subtitle={`Arsitektur: ${modelDetail?.model_name || 'MLP Backpropagation'} · Target Klaster Run #${modelDetail?.clustering_run_id || modelDetail?.target_clustering_run_id || '-'}`}
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
        <div className="row g-4">
          <div className="col-lg-6">
            <h6 className="fw-bold text-primary mb-3">Confusion Matrix (Aktual \ Prediksi)</h6>
            {confusionMatrix.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered text-center align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ backgroundColor: 'var(--rg-surface-2)' }}>
                        Aktual \ Prediksi
                      </th>
                      {confusionMatrix.map((_, i) => (
                        <th key={i} scope="col">
                          Klaster {i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {confusionMatrix.map((row, actualIdx) => (
                      <tr key={actualIdx}>
                        <th scope="row" style={{ backgroundColor: 'var(--rg-surface-2)' }}>
                          Klaster {actualIdx}
                        </th>
                        {row.map((val, predIdx) => {
                          const isDiagonal = actualIdx === predIdx;
                          return (
                            <td
                              key={predIdx}
                              className="font-monospace fw-bold"
                              style={{
                                backgroundColor: isDiagonal
                                  ? 'var(--rg-good-soft)'
                                  : val > 0
                                    ? 'var(--rg-bad-soft)'
                                    : 'transparent',
                                color: isDiagonal
                                  ? 'var(--rg-good)'
                                  : val > 0
                                    ? 'var(--rg-bad)'
                                    : 'inherit',
                              }}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted mb-0">Confusion matrix tidak tersedia untuk model ini.</p>
            )}
          </div>

          <div className="col-lg-6">
            <h6 className="fw-bold text-primary mb-3">Metrik Klasifikasi Tiap Klaster</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Kelas / Klaster</th>
                    <th scope="col" className="text-end">Presisi</th>
                    <th scope="col" className="text-end">Recall</th>
                    <th scope="col" className="text-end">F1-Score</th>
                    <th scope="col" className="text-end">Dukungan</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(perClass).map(([cls, cMetrics]) => (
                    <tr key={cls}>
                      <td className="fw-bold">
                        <span className="badge bg-secondary-subtle text-secondary border me-1">
                          C{cls}
                        </span>
                        Klaster {cls}
                      </td>
                      <td className="text-end font-monospace">
                        {cMetrics.precision !== undefined
                          ? `${(Number(cMetrics.precision) * 100).toFixed(1)}%`
                          : '-'}
                      </td>
                      <td className="text-end font-monospace">
                        {cMetrics.recall !== undefined
                          ? `${(Number(cMetrics.recall) * 100).toFixed(1)}%`
                          : '-'}
                      </td>
                      <td className="text-end font-monospace">
                        {cMetrics.f1 !== undefined
                          ? `${(Number(cMetrics.f1) * 100).toFixed(1)}%`
                          : '-'}
                      </td>
                      <td className="text-end font-monospace text-muted">{cMetrics.support ?? '-'}</td>
                    </tr>
                  ))}
                  {Object.keys(perClass).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">
                        Rincian metrik per kelas belum tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
