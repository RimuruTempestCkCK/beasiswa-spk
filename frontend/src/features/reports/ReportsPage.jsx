import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'experiments'
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

  const handleExportCSV = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('access_token');
    window.open(`${baseUrl}${API.REPORTS.EXPORT_PREDICTIONS}?token=${token || ''}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const recommendations = report?.scholarship_recommendations || [];
  const clusteringRuns = report?.clusters || report?.clustering_runs || [];
  const models = report?.models || [];

  return (
    <>
      <div className="d-print-none">
        <PageTitle
          heading="Laporan Rekomendasi Hasil Seleksi Beasiswa"
          subheading="Laporan penetapan kelayakan calon beasiswa dari hasil inferensi model SPK"
          eyebrow="Pelaporan &amp; Pengambilan Keputusan · SPK Beasiswa"
          actions={
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                onClick={handlePrint}
                title="Cetak langsung atau simpan sebagai dokumen PDF"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Cetak / PDF</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                onClick={handleExportCSV}
                title="Unduh seluruh daftar hasil rekomendasi calon penerima beasiswa dalam file CSV"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Ekspor CSV</span>
              </button>
            </div>
          }
        />

        {/* Analytical summary cards */}
        <section className="kpi-grid mb-4" aria-label="Ringkasan Hasil Evaluasi Rekomendasi">
          <div className="kpi">
            <div className="kpi-top">
              <span className="kpi-icon tone-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <p className="kpi-label">Total Calon Teruji</p>
            </div>
            <p className="kpi-value text-primary">{recommendations.length}</p>
            <p className="kpi-note">Kandidat masuk evaluasi SPK</p>
          </div>

          <div className="kpi">
            <div className="kpi-top">
              <span className="kpi-icon tone-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <p className="kpi-label">Prioritas Sangat Layak</p>
            </div>
            <p className="kpi-value text-success">
              {recommendations.filter((r) => r.predicted_cluster === 2).length}
            </p>
            <p className="kpi-note">Klaster prioritas utama beasiswa</p>
          </div>

          <div className="kpi">
            <div className="kpi-top">
              <span className="kpi-icon tone-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <p className="kpi-label">Kandidat Cadangan</p>
            </div>
            <p className="kpi-value text-info">
              {recommendations.filter((r) => r.predicted_cluster === 1).length}
            </p>
            <p className="kpi-note">Klaster layak (kuota lanjutan)</p>
          </div>

          <div className="kpi">
            <div className="kpi-top">
              <span className="kpi-icon tone-coral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </span>
              <p className="kpi-label">Tidak Direkomendasikan</p>
            </div>
            <p className="kpi-value text-danger">
              {recommendations.filter((r) => r.predicted_cluster === 0).length}
            </p>
            <p className="kpi-note">Belum memenuhi ambang seleksi</p>
          </div>
        </section>

        {/* Tab switcher */}
        <div className="mb-4">
          <ul className="nav nav-pills gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'recommendations' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('recommendations')}
              >
                Daftar Hasil Rekomendasi Seleksi ({recommendations.length} Data)
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'experiments' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('experiments')}
              >
                Audit Eksperimen Model ({clusteringRuns.length} Klaster / {models.length} Model)
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* PRINT-ONLY HEADER FORMAL */}
      <div className="d-none d-print-block mb-4 text-center border-bottom pb-3">
        <h3 className="fw-bold text-uppercase mb-1">Sistem Pendukung Keputusan Seleksi Beasiswa</h3>
        <p className="small text-muted mb-0">Laporan Resmi Hasil Rekomendasi Penetapan Calon Penerima Beasiswa</p>
        <p className="small text-muted mb-0">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p className="text-muted mt-2">Memuat laporan rekomendasi...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: HASIL REKOMENDASI PENERIMA BEASISWA DARI DATA PREDIKSI */}
          {(activeTab === 'recommendations' || window.matchMedia?.('print').matches) && (
            <section className="panel mb-4">
              <div className="panel-head d-print-none">
                <div>
                  <h2 className="panel-title">Rekomendasi Kelayakan Calon Penerima Beasiswa</h2>
                  <p className="panel-sub">
                    Pemeringkatan dan klasifikasi hasil inferensi model Backpropagation terhadap kandidat yang diuji
                  </p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table-data table-stack align-middle">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 50 }} className="text-center">No</th>
                      <th scope="col">Nama Mahasiswa</th>
                      <th scope="col">NIM</th>
                      <th scope="col" className="text-end">IPK</th>
                      <th scope="col" className="text-end">Penghasilan Ortu</th>
                      <th scope="col" className="text-center">Tanggungan</th>
                      <th scope="col" className="text-center">Kehadiran</th>
                      <th scope="col" className="text-center">Klaster</th>
                      <th scope="col">Rekomendasi Keputusan</th>
                      <th scope="col" className="text-end">Keyakinan</th>
                      <th scope="col" className="text-end">Skor SPK</th>
                      <th scope="col" className="d-print-none">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((r, idx) => {
                      let badgeCls = 'bg-secondary-subtle text-secondary border';
                      if (r.predicted_cluster === 2) badgeCls = 'bg-success-subtle text-success border border-success fw-bold';
                      else if (r.predicted_cluster === 1) badgeCls = 'bg-info-subtle text-info border border-info';
                      else if (r.predicted_cluster === 3) badgeCls = 'bg-warning-subtle text-warning border border-warning';
                      else if (r.predicted_cluster === 0) badgeCls = 'bg-danger-subtle text-danger border border-danger';

                      return (
                        <tr key={r.id || idx}>
                          <td className="text-center fw-bold">{idx + 1}</td>
                          <td className="fw-bold text-dark">
                            {r.student_name || <span className="text-muted fst-italic">Tanpa Nama</span>}
                          </td>
                          <td className="font-monospace text-muted small">
                            {r.student_code || '-'}
                          </td>
                          <td className="num text-end font-monospace">{r.ipk.toFixed(2)}</td>
                          <td className="num text-end font-monospace">Rp {r.parent_income.toLocaleString('id-ID')}</td>
                          <td className="text-center font-monospace">{r.family_dependents} org</td>
                          <td className="text-center font-monospace">{r.attendance_percentage.toFixed(1)}%</td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">C{r.predicted_cluster}</span>
                          </td>
                          <td>
                            <span className={`badge ${badgeCls} px-2 py-1`}>
                              {r.status_recommendation}
                            </span>
                          </td>
                          <td className="num text-end font-monospace">
                            {r.confidence_score ? `${(r.confidence_score * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="num text-end fw-bold font-monospace text-primary">
                            {r.score_recommendation.toFixed(2)}
                          </td>
                          <td className="small text-muted d-print-none">
                            {r.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {recommendations.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-5 text-muted">
                          Belum ada data kandidat yang diuji pada menu <strong>Prediksi Kelayakan</strong>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 2: AUDIT EKSPERIMEN (K-MEANS & BACKPROPAGATION) */}
          {activeTab === 'experiments' && (
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
                    <table className="table-data table-stack">
                      <thead>
                        <tr>
                          <th scope="col">Run ID</th>
                          <th scope="col">Jumlah Klaster (K)</th>
                          <th scope="col" className="text-end">Skor DBI</th>
                          <th scope="col">Status Acuan</th>
                          <th scope="col" className="text-end">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clusteringRuns.map((c) => (
                          <tr key={c.id}>
                            <td className="font-monospace">#{c.id}</td>
                            <td>K = {c.k_value || c.k}</td>
                            <td className="num text-end font-monospace">
                              {c.dbi_score !== null && c.dbi_score !== undefined
                                ? Number(c.dbi_score).toFixed(4)
                                : '-'}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  c.is_selected
                                    ? 'bg-success-subtle text-success border'
                                    : 'bg-light text-muted border'
                                }`}
                              >
                                {c.is_selected ? 'Acuan Terpilih' : 'Pembanding'}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setSelectedClusteringRun(c)}
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Models Table */}
              <div className="col-lg-6">
                <section className="panel h-100">
                  <div className="panel-head">
                    <div>
                      <h2 className="panel-title">Model Neural Network Backpropagation</h2>
                      <p className="panel-sub">Kinerja model pengklasifikasi</p>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="table-data table-stack">
                      <thead>
                        <tr>
                          <th scope="col">Nama / Versi</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="text-end">Akurasi</th>
                          <th scope="col" className="text-end">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {models.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <strong>{m.name || m.model_name}</strong>
                              <span className="text-muted small d-block">v{m.version || m.model_version}</span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  m.status === 'ready'
                                    ? 'bg-success-subtle text-success border'
                                    : 'bg-secondary-subtle text-secondary'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="num text-end font-monospace">
                              {m.accuracy !== null && m.accuracy !== undefined
                                ? `${(Number(m.accuracy) * 100).toFixed(1)}%`
                                : '-'}
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setSelectedModel(m)}
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          )}
        </>
      )}

      {/* POPUP MODAL: Detail Clustering Run */}
      <Modal
        isOpen={!!selectedClusteringRun}
        onClose={() => setSelectedClusteringRun(null)}
        size="md"
        title={`Eksperimen K-Means Run #${selectedClusteringRun?.id || ''}`}
        subtitle={`Preprocessing ID #${selectedClusteringRun?.preprocessing_run_id || '-'}`}
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedClusteringRun(null)}>
            Tutup
          </button>
        }
      >
        {selectedClusteringRun && (
          <ul className="list-group list-group-flush border rounded small">
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span>Jumlah Klaster (K)</span>
              <span className="fw-bold font-monospace">{selectedClusteringRun.k_value || selectedClusteringRun.k}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span>Skor Davies-Bouldin (DBI)</span>
              <span className="fw-bold font-monospace text-primary">
                {selectedClusteringRun.dbi_score ? Number(selectedClusteringRun.dbi_score).toFixed(4) : '-'}
              </span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span>Status Acuan Model</span>
              <span className="badge bg-success-subtle text-success border">
                {selectedClusteringRun.is_selected ? 'Acuan Terpilih' : 'Eksperimen Pembanding'}
              </span>
            </li>
          </ul>
        )}
      </Modal>

      {/* POPUP MODAL: Detail Model */}
      <Modal
        isOpen={!!selectedModel}
        onClose={() => setSelectedModel(null)}
        size="md"
        title={`Versi Model: ${selectedModel?.name || selectedModel?.model_name || ''}`}
        subtitle={`Versi v${selectedModel?.version || selectedModel?.model_version || ''}`}
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedModel(null)}>
            Tutup
          </button>
        }
      >
        {selectedModel && (
          <ul className="list-group list-group-flush border rounded small">
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span>Akurasi Model</span>
              <span className="fw-bold font-monospace text-success">
                {selectedModel.accuracy ? `${(Number(selectedModel.accuracy) * 100).toFixed(2)}%` : '-'}
              </span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span>Status Kesiapan</span>
              <span className="badge bg-primary">{selectedModel.status}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span>Target Klaster Acuan</span>
              <span className="font-monospace">Run #{selectedModel.clustering_run_id || selectedModel.target_clustering_run_id || '-'}</span>
            </li>
          </ul>
        )}
      </Modal>
    </>
  );
}
