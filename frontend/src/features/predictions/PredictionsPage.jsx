import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function PredictionsPage() {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [formData, setFormData] = useState({
    ipk: '',
    parent_income: '',
    family_dependents: '',
    academic_achievement_score: '',
    nonacademic_achievement_score: '',
    attendance_percentage: '',
    notes: '',
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    // Resolve single active ready model deterministically from backend
    apiClient
      .get(API.MODELS.ACTIVE)
      .then((res) => {
        if (res.data && res.data.id) {
          setModels([res.data]);
          setSelectedModelId(res.data.id);
        }
      })
      .catch(() => {
        // Fallback list of ready models if specific active route is empty
        apiClient.get(API.MODELS.LIST).then((res) => {
          const items = res.data.items || res.data || [];
          const readyModels = items.filter((m) => m.status === 'ready');
          setModels(readyModels);
          if (readyModels.length > 0) setSelectedModelId(readyModels[0].id);
        });
      });
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    apiClient
      .get(API.PREDICTIONS.LIST)
      .then((res) => {
        setHistory(res.data.items || res.data || []);
      })
      .catch(() => {});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedModelId) {
      toast.warning('Pilih model berstatus ready terlebih dahulu!');
      return;
    }
    setLoading(true);
    setResult(null);

    const payload = {
      model_version_id: parseInt(selectedModelId),
      ipk: parseFloat(formData.ipk),
      parent_income: parseFloat(formData.parent_income),
      family_dependents: parseInt(formData.family_dependents),
      academic_achievement_score: parseFloat(formData.academic_achievement_score),
      nonacademic_achievement_score: parseFloat(formData.nonacademic_achievement_score),
      attendance_percentage: parseFloat(formData.attendance_percentage),
      notes: formData.notes,
    };

    apiClient
      .post(API.PREDICTIONS.CREATE, payload)
      .then((res) => {
        setResult(res.data);
        setIsResultModalOpen(true);
        toast.success('Inferensi prediksi berhasil dijalankan!');
        fetchHistory();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal memproses inferensi prediksi');
      })
      .finally(() => setLoading(false));
  };

  const handleOpenHistoryDetail = (item) => {
    setSelectedHistoryItem(item);
    setIsHistoryModalOpen(true);
  };

  return (
    <>
      <PageTitle
        heading="Prediksi Kelayakan Beasiswa"
        subheading="Inferensi klasifikasi data mahasiswa baru ke dalam klaster rekomendasi menggunakan model Backpropagation aktif"
        eyebrow="Prediksi &amp; Laporan · SPK Beasiswa"
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
          <strong>Disclaimer Rekomendasi Keputusan:</strong> Hasil inferensi ini mengklasifikasikan data pendaftar ke dalam <strong>Pola Klaster Hasil Data Mining</strong> sebagai instrumen pendukung keputusan.
        </div>
      </div>

      {models.length === 0 && (
        <div className="alert alert-warning mb-4" role="alert">
          Belum ada model Backpropagation berstatus <strong>ready</strong>. Masuk ke menu <strong>Training Model</strong> dan aktifkan model sebelum melakukan prediksi.
        </div>
      )}

      <div className="row g-3 g-xxl-4 mb-4">
        {/* Form Input */}
        <div className="col-lg-8">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Form Input 6 Variabel Mahasiswa</h2>
                <p className="panel-sub">Masukkan parameter akademik dan sosio-ekonomi calon penerima beasiswa</p>
              </div>
            </div>
            <div className="panel-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="modelSelect">
                    Pilih Versi Model (Status: Ready) *
                  </label>
                  <select
                    id="modelSelect"
                    className="form-select"
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    required
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model_name || `Model #${m.id}`} (v{m.model_version || m.version}) - Akurasi: {m.accuracy ? `${(Number(m.accuracy) * 100).toFixed(1)}%` : '-'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="ipk">
                      IPK (0.00 - 4.00) *
                    </label>
                    <input
                      id="ipk"
                      name="ipk"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      className="form-control"
                      value={formData.ipk}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 3.65"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="parent_income">
                      Penghasilan Orang Tua (Rp) *
                    </label>
                    <input
                      id="parent_income"
                      name="parent_income"
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.parent_income}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 2500000"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="family_dependents">
                      Jumlah Tanggungan Keluarga *
                    </label>
                    <input
                      id="family_dependents"
                      name="family_dependents"
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.family_dependents}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 3"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="academic_achievement_score">
                      Skor Prestasi Akademik (0 - 100) *
                    </label>
                    <input
                      id="academic_achievement_score"
                      name="academic_achievement_score"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.academic_achievement_score}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 85"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="nonacademic_achievement_score">
                      Skor Prestasi Non-Akademik (0 - 100) *
                    </label>
                    <input
                      id="nonacademic_achievement_score"
                      name="nonacademic_achievement_score"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.nonacademic_achievement_score}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 70"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="attendance_percentage">
                      Persentase Kehadiran (%) *
                    </label>
                    <input
                      id="attendance_percentage"
                      name="attendance_percentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.attendance_percentage}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 95.0"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="notes">
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    className="form-control"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Contoh: Pendaftar Program Unggulan Kampus"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-lg"
                  disabled={loading || models.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Memproses Inferensi...
                    </>
                  ) : (
                    'Jalankan Prediksi Kelayakan (Pop-Up)'
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Prediction Output Status Card */}
        <div className="col-lg-4">
          <section className="panel h-100 d-flex flex-column justify-content-between">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Status Inferensi Terakhir</h2>
                <p className="panel-sub">Hasil pengujian model aktif</p>
              </div>
            </div>
            <div className="panel-body text-center py-4">
              {result ? (
                <div>
                  <span className="badge bg-success-subtle text-success fs-5 p-3 mb-3 border border-success">
                    Klaster C{result.predicted_cluster ?? result.cluster_label}
                  </span>
                  <h4 className="fw-bold mb-2">Prediksi Berhasil</h4>
                  <p className="text-muted small mb-3">
                    Kepercayaan: {result.confidence_score ? `${(Number(result.confidence_score) * 100).toFixed(1)}%` : '-'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setIsResultModalOpen(true)}
                  >
                    Buka Rincian Hasil (Pop-Up)
                  </button>
                </div>
              ) : (
                <div className="text-muted py-4">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: 48, height: 48, opacity: 0.35 }}
                    className="mb-2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="mb-0 small">
                    Hasil inferensi akan otomatis muncul dalam pop-up interaktif setelah Anda menekan tombol jalankan prediksi.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Prediction History Table */}
      <section className="panel mb-4">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Riwayat Prediksi Terbaru</h2>
            <p className="panel-sub">Daftar ringkas log prediksi (klik tombol detail untuk melihat rincian pop-up)</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table-data table-stack">
            <thead>
              <tr>
                <th scope="col">Waktu</th>
                <th scope="col">Model</th>
                <th scope="col" className="text-end">IPK</th>
                <th scope="col" className="text-end">Gaji Ortu</th>
                <th scope="col">Klaster Hasil</th>
                <th scope="col" className="text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="num">
                    {h.created_at
                      ? new Date(h.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td>v{h.model_version_id}</td>
                  <td className="num text-end">{h.ipk ? Number(h.ipk).toFixed(2) : '-'}</td>
                  <td className="num text-end">
                    {h.parent_income
                      ? `Rp ${Number(h.parent_income).toLocaleString('id-ID')}`
                      : '-'}
                  </td>
                  <td>
                    <span className="badge bg-info-subtle text-info border">
                      Klaster {h.predicted_cluster}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenHistoryDetail(h)}
                    >
                      Detail (Pop-Up)
                    </button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Belum ada riwayat inferensi prediksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* POPUP MODAL: Hasil Prediksi Terkini */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        size="md"
        title="Hasil Rekomendasi Prediksi Beasiswa"
        subtitle="Inferensi Jaringan Saraf Backpropagation MLP (6 Indikator)"
        footer={
          <button
            type="button"
            className="btn btn-primary px-4"
            onClick={() => setIsResultModalOpen(false)}
          >
            Tutup
          </button>
        }
      >
        {result && (() => {
          const clusterNum = Number(result.predicted_cluster ?? result.cluster_label);
          // Berdasarkan analisis sentroid K=4 aktif:
          // C2: IPK 3.80, Gaji 872rb, Tanggungan 5, Prestasi 3.7 -> PRIORITAS UTAMA
          // C1: IPK 3.40, Gaji 1.69jt, Tanggungan 3.3, Prestasi 2.3 -> LAYAK (CADANGAN)
          // C3: IPK 2.84, Gaji 3.50jt, Tanggungan 1.8, Prestasi 0.6 -> KURANG LAYAK / DIPERTIMBANGKAN
          // C0: IPK 2.38, Gaji 6.28jt, Tanggungan 0.7, Prestasi 0.0 -> TIDAK LAYAK
          let badgeColor = 'bg-primary-subtle text-primary border-primary';
          let titleStatus = 'Hasil Klasifikasi Klaster';
          let descStatus = 'Kandidat memiliki karakteristik yang sesuai dengan pola klaster ini.';

          if (clusterNum === 2) {
            badgeColor = 'bg-success-subtle text-success border-success';
            titleStatus = 'SANGAT LAYAK (Prioritas Utama Beasiswa)';
            descStatus = 'Kandidat memiliki prestasi akademik sangat tinggi (IPK tinggi, keaktifan prestasi & kehadiran) serta kondisi ekonomi keluarga yang paling membutuhkan bantuan finansial.';
          } else if (clusterNum === 1) {
            badgeColor = 'bg-info-subtle text-info border-info';
            titleStatus = 'LAYAK (Kandidat Cadangan / Kuota Lanjutan)';
            descStatus = 'Kandidat memiliki catatan akademik baik dan kondisi ekonomi menengah-ke-bawah yang memenuhi kriteria penerimaan beasiswa.';
          } else if (clusterNum === 3) {
            badgeColor = 'bg-warning-subtle text-warning border-warning';
            titleStatus = 'DIPERTIMBANGKAN (Prioritas Rendah)';
            descStatus = 'Kandidat memiliki capaian akademik cukup, namun tingkat kebutuhan finansial tidak mendesak dibanding klaster prioritas.';
          } else if (clusterNum === 0) {
            badgeColor = 'bg-danger-subtle text-danger border-danger';
            titleStatus = 'TIDAK LAYAK / TIDAK DIREKOMENDASIKAN';
            descStatus = 'Kandidat tergolong mampu secara sosio-ekonomi (penghasilan ortu tinggi) atau catatan akademik/kehadiran belum memenuhi ambang seleksi beasiswa.';
          }

          return (
            <div className="py-2">
              <div className="text-center mb-3">
                <span className={`badge ${badgeColor} fs-5 px-3 py-2 border mb-2 d-inline-block`}>
                  Klaster C{clusterNum}
                </span>
                <h4 className="fw-bold mb-1">{titleStatus}</h4>
                <p className="text-muted small mb-0 font-monospace">
                  Confidence Score: {result.confidence_score ? `${(Number(result.confidence_score) * 100).toFixed(2)}% (Tingkat Keyakinan Model)` : '-'}
                </p>
              </div>

              <div className="p-3 rounded mb-3 bg-light border small">
                <h6 className="fw-bold mb-2 text-dark">Makna &amp; Profil Rekomendasi:</h6>
                <p className="mb-2 text-muted">
                  {descStatus}
                </p>
                <div className="border-top pt-2 mt-2 text-muted" style={{ fontSize: '0.8rem' }}>
                  Model Jaringan Saraf Tiruan telah memetakan 6 indikator kandidat (IPK, Gaji Ortu, Tanggungan, Prestasi Akademik/Non-akademik, Kehadiran) terhadap pola sentroid klaster.
                </div>
              </div>

              <div className="alert alert-secondary py-2 small mb-0">
                <strong>Catatan SPK:</strong> Rekomendasi ini adalah sistem pendukung keputusan analitis untuk membantu panitia dalam memprioritaskan kuota beasiswa.
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* POPUP MODAL: Detail Riwayat Prediksi */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        size="md"
        title={`Rincian Record Prediksi #${selectedHistoryItem?.id || ''}`}
        subtitle={`Waktu Inferensi: ${selectedHistoryItem?.created_at ? new Date(selectedHistoryItem.created_at).toLocaleString('id-ID') : '-'}`}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsHistoryModalOpen(false)}
          >
            Tutup
          </button>
        }
      >
        {selectedHistoryItem && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Klaster Hasil Inferensi</span>
                <span className="fs-5 fw-bold text-primary">Klaster {selectedHistoryItem.predicted_cluster}</span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Model Versi</span>
                <span className="badge bg-secondary">v{selectedHistoryItem.model_version_id}</span>
              </div>
            </div>

            <h6 className="fw-bold text-primary mb-2">6 Parameter Calon Penerima:</h6>
            <ul className="list-group list-group-flush border rounded mb-3">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Indeks Prestasi Kumulatif (IPK)</span>
                <span className="fw-bold font-monospace">{Number(selectedHistoryItem.ipk).toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Penghasilan Orang Tua</span>
                <span className="fw-bold font-monospace">Rp {Number(selectedHistoryItem.parent_income).toLocaleString('id-ID')}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Jumlah Tanggungan Keluarga</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.family_dependents} Orang</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Skor Prestasi Akademik</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.academic_achievement_score} / 100</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Skor Prestasi Non-Akademik</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.nonacademic_achievement_score} / 100</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Persentase Kehadiran</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.attendance_percentage}%</span>
              </li>
            </ul>

            {selectedHistoryItem.notes && (
              <div className="p-3 bg-light rounded border small">
                <strong>Catatan Pendaftaran:</strong> {selectedHistoryItem.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
