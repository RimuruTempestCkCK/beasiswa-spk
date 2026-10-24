import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function EvaluationPage() {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [modelDetail, setModelDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get(API.MODELS.LIST).then((res) => {
      const items = res.data.items || res.data || [];
      setModels(items);
      if (items.length > 0) {
        setSelectedModelId(items[0].id);
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
          <strong>Penting &amp; Disclaimer Evaluasi:</strong> Target pelatihan Backpropagation adalah label cluster K-Means, sehingga metrik evaluasi di bawah ini mengukur seberapa baik jaringan saraf meniru dan mengklasifikasikan pola data sesuai cluster acuan. Metrik ini <em>bukan</em> bukti otomatis kelayakan riil penerima beasiswa.
        </div>
      </div>

      {/* Model Selector Panel */}
      <section className="panel mb-4">
        <div className="panel-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <label className="form-label fw-bold" htmlFor="modelSelect">
                Pilih Versi Model untuk Dievaluasi
              </label>
              <select
                id="modelSelect"
                className="form-select"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.model_name || `Model #${m.id}`} (v{m.model_version || m.version}) - Status: {m.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 text-md-end pt-md-4">
              {modelDetail && (
                <span className="text-muted small">
                  Target Klaster Run: <strong>#{modelDetail.clustering_run_id}</strong> · Data Uji: <strong>{((modelDetail.test_size || 0.2) * 100).toFixed(0)}%</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p className="text-muted mt-2">Memuat metrik evaluasi model...</p>
        </div>
      ) : modelDetail ? (
        <>
          {/* KPI Grid for Key Evaluation Metrics */}
          <section className="kpi-grid mb-4" aria-label="Ringkasan Metrik Evaluasi">
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <p className="kpi-label">Akurasi Uji (Accuracy)</p>
              </div>
              <p className="kpi-value text-success">
                {metrics.accuracy !== undefined ? `${(Number(metrics.accuracy) * 100).toFixed(2)}%` : '-'}
              </p>
              <p className="kpi-note">Kecocokan klasifikasi data uji</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                </span>
                <p className="kpi-label">Macro Precision</p>
              </div>
              <p className="kpi-value">
                {metrics.precision_macro !== undefined ? `${(Number(metrics.precision_macro) * 100).toFixed(2)}%` : '-'}
              </p>
              <p className="kpi-note">Rata-rata presisi antar kelas</p>
            </div>

            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-icon tone-amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
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

          {/* Confusion Matrix and Per-Class Breakdown */}
          <div className="row g-3 g-xxl-4">
            <div className="col-lg-6">
              <section className="panel h-100">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title">Confusion Matrix</h2>
                    <p className="panel-sub">Distribusi prediksi model vs label klaster aktual</p>
                  </div>
                </div>
                <div className="panel-body">
                  {confusionMatrix.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered text-center align-middle">
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
                                    className="num fw-bold fs-6"
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
              </section>
            </div>

            <div className="col-lg-6">
              <section className="panel h-100">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title">Metrik Klasifikasi Tiap Klaster</h2>
                    <p className="panel-sub">Rincian presisi, recall, dan f1-score per kelas</p>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table-data table-compact">
                    <thead>
                      <tr>
                        <th scope="col">Kelas / Klaster</th>
                        <th scope="col" className="text-end">Presisi</th>
                        <th scope="col" className="text-end">Recall</th>
                        <th scope="col" className="text-end">F1-Score</th>
                        <th scope="col" className="text-end">Jumlah Sampel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(perClass).length > 0 ? (
                        Object.entries(perClass).map(([cls, val]) => (
                          <tr key={cls}>
                            <td className="cell-main fw-semibold">
                              Klaster {cls}
                            </td>
                            <td className="num text-end">
                              {val.precision !== undefined ? `${(Number(val.precision) * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="num text-end">
                              {val.recall !== undefined ? `${(Number(val.recall) * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="num text-end">
                              {val.f1 !== undefined ? `${(Number(val.f1) * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="num text-end">{val.support ?? '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            Data rincian metrik per kelas belum tersedia.
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
      ) : (
        <div className="p-4 text-center">
          <p className="text-muted mb-0">Pilih model untuk melihat evaluasi.</p>
        </div>
      )}
    </>
  );
}
