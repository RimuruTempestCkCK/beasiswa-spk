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

      {/* Header Info / Disclaimer Compact */}
      <div className="d-flex align-items-center justify-content-between p-2 px-3 mb-3 bg-warning-subtle border border-warning rounded small text-dark">
        <div className="d-flex align-items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 16, height: 16, flexShrink: 0 }}
            className="text-warning-emphasis"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>Catatan Evaluasi:</strong> Target Backpropagation adalah label cluster K-Means acuan (mengukur presisi pemetaan pola 6 indikator beasiswa).
          </span>
        </div>
        <span className="badge bg-success-subtle text-success border border-success px-2 py-1 ms-2 text-nowrap">
          Leakage-Free Verified
        </span>
      </div>

      {/* Model Selector & Metadata in a Single Compact Card */}
      <section className="panel mb-3">
        <div className="panel-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-lg-4 col-md-5">
              <label className="form-label small fw-bold text-muted mb-1" htmlFor="modelSelect">
                Pilih Versi Model Terlatih
              </label>
              <select
                id="modelSelect"
                className="form-select form-select-sm"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.model_name || `Model #${m.id}`} (v{m.model_version || m.version}) — {m.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-8 col-md-7">
              <div className="d-flex flex-wrap align-items-center justify-content-md-end gap-2 pt-md-3">
                <div className="d-inline-flex align-items-center gap-2 bg-light border px-2 py-1 rounded small">
                  <span className="text-muted">Status:</span>
                  <span className={`badge bg-${modelDetail?.status === 'ready' ? 'success' : 'secondary'} text-uppercase`}>
                    {modelDetail?.status || 'UNKNOWN'}
                  </span>
                </div>
                <div className="d-inline-flex align-items-center gap-2 bg-light border px-2 py-1 rounded small font-monospace">
                  <span className="text-muted">Klaster Acuan:</span>
                  <span className="fw-semibold">Run #{modelDetail?.target_clustering_run_id || modelDetail?.clustering_run_id || '-'}</span>
                </div>
                <div className="d-inline-flex align-items-center gap-2 bg-light border px-2 py-1 rounded small font-monospace">
                  <span className="text-muted">Split Data:</span>
                  <span className="fw-semibold">
                    {((modelDetail?.training_config?.test_size || 0.2) * 100).toFixed(0)}% Uji / {((1 - (modelDetail?.training_config?.test_size || 0.2)) * 100).toFixed(0)}% Latih
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 ms-lg-2"
                  onClick={() => setIsModalOpen(true)}
                  disabled={!modelDetail}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <span>Lihat Confusion Matrix</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Memuat evaluasi model...</p>
        </div>
      ) : (
        <>
          {/* Compact Inline Metrics Bar */}
          <section className="panel mb-3">
            <div className="panel-body p-3">
              <div className="row g-2 text-center align-items-center">
                <div className="col-6 col-md-3 border-end-md">
                  <div className="text-muted small mb-1">Akurasi Pengujian</div>
                  <div className="fs-4 fw-bold text-teal font-monospace lh-1">
                    {metrics.accuracy !== undefined ? `${(Number(metrics.accuracy) * 100).toFixed(2)}%` : '-'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Klasifikasi Benar</div>
                </div>

                <div className="col-6 col-md-3 border-end-md">
                  <div className="text-muted small mb-1">Macro Precision</div>
                  <div className="fs-4 fw-bold text-amber font-monospace lh-1">
                    {metrics.precision_macro !== undefined ? `${(Number(metrics.precision_macro) * 100).toFixed(2)}%` : '-'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Ketepatan Prediksi</div>
                </div>

                <div className="col-6 col-md-3 border-end-md">
                  <div className="text-muted small mb-1">Macro Recall</div>
                  <div className="fs-4 fw-bold text-success font-monospace lh-1">
                    {metrics.recall_macro !== undefined ? `${(Number(metrics.recall_macro) * 100).toFixed(2)}%` : '-'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Sensitivitas Temuan</div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="text-muted small mb-1">Macro F1-Score</div>
                  <div className="fs-4 fw-bold text-secondary font-monospace lh-1">
                    {metrics.f1_macro !== undefined ? `${(Number(metrics.f1_macro) * 100).toFixed(2)}%` : '-'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Presisi vs Recall</div>
                </div>
              </div>
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
