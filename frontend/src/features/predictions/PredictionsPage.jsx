import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';
import Modal from '../../components/Modal';

export default function PredictionsPage() {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [mode, setMode] = useState('single'); // 'single' | 'batch'
  
  // Single form data
  const [formData, setFormData] = useState({
    student_name: '',
    student_code: '',
    ipk: '',
    parent_income: '',
    family_dependents: '',
    academic_achievement_score: '',
    nonacademic_achievement_score: '',
    attendance_percentage: '',
    notes: '',
  });

  // Batch CSV file
  const [batchFile, setBatchFile] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const fileInputRef = useRef(null);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    apiClient
      .get(API.MODELS.ACTIVE)
      .then((res) => {
        if (res.data && res.data.id) {
          setModels([res.data]);
          setSelectedModelId(res.data.id);
        }
      })
      .catch(() => {
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

  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (!selectedModelId) {
      toast.warning('Pilih model berstatus ready terlebih dahulu!');
      return;
    }
    setLoading(true);
    setResult(null);

    const payload = {
      model_version_id: parseInt(selectedModelId),
      student_name: formData.student_name.trim() || null,
      student_code: formData.student_code.trim() || null,
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

  const handleBatchSubmit = (e) => {
    e.preventDefault();
    if (!batchFile) {
      toast.warning('Silakan pilih berkas CSV / Excel terlebih dahulu!');
      return;
    }
    if (!selectedModelId) {
      toast.warning('Pilih model berstatus ready terlebih dahulu!');
      return;
    }

    setLoading(true);
    setBatchResults(null);

    const data = new FormData();
    data.append('file', batchFile);
    data.append('model_version_id', selectedModelId);

    apiClient
      .post(API.PREDICTIONS.BATCH, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => {
        setBatchResults(res.data.items || []);
        toast.success(`Berhasil memproses prediksi untuk ${res.data.total_processed} mahasiswa!`);
        fetchHistory();
        if (fileInputRef.current) fileInputRef.current.value = '';
        setBatchFile(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal memproses prediksi berkas CSV');
      })
      .finally(() => setLoading(false));
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      'nim,nama,ipk,penghasilan_ortu,jumlah_tanggungan,skor_prestasi_akademik,skor_prestasi_nonakademik,persentase_kehadiran,catatan\n' +
      'MHS2024101,Rizky Fauzan,3.85,1200000,4,3.5,3.0,96,Pengajuan Beasiswa Mandiri\n' +
      'MHS2024102,Dewi Anggraini,3.40,2500000,3,2.0,1.5,88,Kandidat Cadangan Kuota\n' +
      'MHS2024103,Bagas Pratama,2.45,6500000,1,0.5,0.0,70,Data Pembanding Tidak Mampu\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_prediksi_banyak.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenHistoryDetail = (item) => {
    setSelectedHistoryItem(item);
    setIsHistoryModalOpen(true);
  };

  const handlePromptDelete = (item) => {
    setDeleteTarget(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(API.PREDICTIONS.DELETE(deleteTarget.id));
      toast.success(`Riwayat #${deleteTarget.id} berhasil dihapus`);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menghapus riwayat');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (cluster) => {
    const c = Number(cluster);
    if (c === 2) return <span className="badge bg-success-subtle text-success border border-success fw-bold">Sangat Layak (C2)</span>;
    if (c === 1) return <span className="badge bg-info-subtle text-info border border-info">Layak (C1)</span>;
    if (c === 3) return <span className="badge bg-warning-subtle text-warning border border-warning">Dipertimbangkan (C3)</span>;
    return <span className="badge bg-danger-subtle text-danger border border-danger">Tidak Layak (C0)</span>;
  };

  return (
    <>
      <div className="d-print-none">
        <PageTitle
          heading="Prediksi Kelayakan Beasiswa"
          subheading="Uji kelayakan calon penerima beasiswa secara individu maupun banyak melalui unggah CSV"
          eyebrow="SPK Beasiswa"
          actions={
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                onClick={handlePrint}
                title="Cetak atau simpan halaman ini sebagai PDF"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Cetak / PDF</span>
              </button>
            </div>
          }
        />

        {models.length === 0 && (
          <div className="alert alert-warning mb-4" role="alert">
            Belum ada model Backpropagation berstatus <strong>ready</strong>. Silakan latih dan aktifkan model di menu <strong>Training Model</strong> terlebih dahulu.
          </div>
        )}

        {/* Tab Mode: Prediksi Satuan vs Prediksi Banyak (CSV) */}
        <div className="mb-4">
          <ul className="nav nav-pills gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${mode === 'single' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setMode('single')}
              >
                Input Perorangan (Satuan)
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${mode === 'batch' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setMode('batch')}
              >
                Unggah Berkas Banyak (Upload CSV)
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* HEADER CETAK RESMI */}
      <div className="d-none d-print-block mb-4 text-center border-bottom pb-3">
        <h3 className="fw-bold text-uppercase mb-1">Hasil Evaluasi Kelayakan Calon Penerima Beasiswa</h3>
        <p className="small text-muted mb-0">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* MODE 1: SATUAN */}
      {mode === 'single' && (
        <div className="row g-4 mb-4 d-print-none">
          <div className="col-12 col-lg-7">
            <section className="panel h-100">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Form Input Mahasiswa</h2>
                  <p className="panel-sub">Lengkapi identitas dan 6 indikator penilaian</p>
                </div>
              </div>
              <div className="p-3">
                <form onSubmit={handleSingleSubmit}>
                  <div className="row g-3 mb-3 p-2 bg-light rounded border">
                    <div className="col-md-7">
                      <label className="form-label fw-bold" htmlFor="student_name">
                        Nama Mahasiswa
                      </label>
                      <input
                        id="student_name"
                        name="student_name"
                        type="text"
                        className="form-control"
                        value={formData.student_name}
                        onChange={handleChange}
                        placeholder="Contoh: Ahmad Fauzi"
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-bold" htmlFor="student_code">
                        NIM / No. Pendaftaran
                      </label>
                      <input
                        id="student_code"
                        name="student_code"
                        type="text"
                        className="form-control"
                        value={formData.student_code}
                        onChange={handleChange}
                        placeholder="Contoh: MHS2024001"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="model_version_id">
                      Model Acuan *
                    </label>
                    <select
                      id="model_version_id"
                      name="model_version_id"
                      className="form-select"
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Model --</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.model_name || `Model v${m.id}`} ({m.metrics?.accuracy ? `Akurasi ${(m.metrics.accuracy * 100).toFixed(1)}%` : 'Ready'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="ipk">IPK (0.00 - 4.00) *</label>
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
                        placeholder="3.75"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="parent_income">Penghasilan Ortu (Rp) *</label>
                      <input
                        id="parent_income"
                        name="parent_income"
                        type="number"
                        min="0"
                        className="form-control"
                        value={formData.parent_income}
                        onChange={handleChange}
                        required
                        placeholder="1500000"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="family_dependents">Jumlah Tanggungan *</label>
                      <input
                        id="family_dependents"
                        name="family_dependents"
                        type="number"
                        min="0"
                        className="form-control"
                        value={formData.family_dependents}
                        onChange={handleChange}
                        required
                        placeholder="3"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="academic_achievement_score">Prestasi Akademik (0 - 4) *</label>
                      <input
                        id="academic_achievement_score"
                        name="academic_achievement_score"
                        type="number"
                        step="0.1"
                        min="0"
                        max="4"
                        className="form-control"
                        value={formData.academic_achievement_score}
                        onChange={handleChange}
                        required
                        placeholder="3.0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="nonacademic_achievement_score">Prestasi Non-Akademik (0 - 4) *</label>
                      <input
                        id="nonacademic_achievement_score"
                        name="nonacademic_achievement_score"
                        type="number"
                        step="0.1"
                        min="0"
                        max="4"
                        className="form-control"
                        value={formData.nonacademic_achievement_score}
                        onChange={handleChange}
                        required
                        placeholder="2.0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="attendance_percentage">Kehadiran (%) *</label>
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
                        placeholder="95"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label" htmlFor="notes">Catatan (Opsional)</label>
                    <input
                      id="notes"
                      name="notes"
                      type="text"
                      className="form-control"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Keterangan singkat"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={loading || !selectedModelId}
                  >
                    {loading ? (
                      <div className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      <span>Jalankan Prediksi</span>
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>

          <div className="col-12 col-lg-5">
            <section className="panel h-100">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Hasil Keputusan Terakhir</h2>
                  <p className="panel-sub">Ringkasan calon yang baru saja diuji</p>
                </div>
              </div>
              <div className="p-3">
                {result ? (
                  <div className="text-center py-3">
                    <h5 className="fw-bold mb-1">{result.student_name || 'Tanpa Nama'}</h5>
                    <p className="text-muted small font-monospace mb-3">{result.student_code || 'Tanpa NIM'}</p>
                    <div className="mb-3">{getStatusBadge(result.predicted_cluster)}</div>
                    <p className="small text-muted font-monospace">
                      Confidence Score: {result.confidence_score ? `${(Number(result.confidence_score) * 100).toFixed(1)}%` : '-'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-0 small">Masukkan data mahasiswa di formulir sebelah kiri untuk melihat hasil kelayakan.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* MODE 2: UNGGAH BANYAK (CSV) */}
      {mode === 'batch' && (
        <section className="panel mb-4 d-print-none">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Prediksi Sekaligus Menggunakan Berkas CSV</h2>
              <p className="panel-sub">Unggah daftar banyak calon mahasiswa untuk diprediksi secara otomatis</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleDownloadSampleCSV}
            >
              Unduh Format Template CSV
            </button>
          </div>
          <div className="p-3">
            <form onSubmit={handleBatchSubmit}>
              <div className="row g-3 align-items-center mb-3">
                <div className="col-md-5">
                  <label className="form-label fw-bold">Pilih Berkas CSV / Excel</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="form-control"
                    onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                    required
                  />
                  <div className="form-text small">Mendukung format .csv atau .xlsx dengan header nama, nim, ipk, dll.</div>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Model Acuan *</label>
                  <select
                    className="form-select"
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Model --</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model_name || `Model v${m.id}`} ({m.metrics?.accuracy ? `Akurasi ${(m.metrics.accuracy * 100).toFixed(1)}%` : 'Ready'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 pt-md-4">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={loading || !batchFile || !selectedModelId}
                  >
                    {loading ? (
                      <div className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      'Proses Prediksi Berkas'
                    )}
                  </button>
                </div>
              </div>
            </form>

            {batchResults && batchResults.length > 0 && (
              <div className="alert alert-success mt-3 py-2 mb-0 small">
                Berhasil memproses <strong>{batchResults.length}</strong> data. Hasil sudah otomatis tersimpan di tabel riwayat di bawah.
              </div>
            )}
          </div>
        </section>
      )}

      {/* TABEL HASIL / RIWAYAT PREDIKSI */}
      <section className="panel mb-4">
        <div className="panel-head d-print-none">
          <div>
            <h2 className="panel-title">Daftar Hasil Keputusan Calon Penerima Beasiswa</h2>
            <p className="panel-sub">Daftar mahasiswa yang telah diuji (NIM, Nama, Nilai Indikator, dan Rekomendasi Kelayakan)</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table-data table-stack align-middle">
            <thead>
              <tr>
                <th scope="col" style={{ width: 45 }} className="text-center">No</th>
                <th scope="col">Nama Mahasiswa</th>
                <th scope="col">NIM</th>
                <th scope="col" className="text-end">IPK</th>
                <th scope="col" className="text-end">Gaji Ortu</th>
                <th scope="col" className="text-center">Tanggungan</th>
                <th scope="col" className="text-center">Kehadiran</th>
                <th scope="col" className="text-center">Hasil Keputusan</th>
                <th scope="col" className="text-end">Keyakinan</th>
                <th scope="col" className="text-end d-print-none">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, idx) => (
                <tr key={h.id}>
                  <td className="text-center font-monospace">{idx + 1}</td>
                  <td className="fw-bold text-dark">
                    {h.student_name || <span className="text-muted fst-italic">Tanpa Nama</span>}
                  </td>
                  <td className="font-monospace text-muted small">{h.student_code || '-'}</td>
                  <td className="num text-end font-monospace">{h.ipk ? Number(h.ipk).toFixed(2) : '-'}</td>
                  <td className="num text-end font-monospace">
                    {h.parent_income ? `Rp ${Number(h.parent_income).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="text-center font-monospace">{h.family_dependents} org</td>
                  <td className="text-center font-monospace">{h.attendance_percentage}%</td>
                  <td className="text-center">{getStatusBadge(h.predicted_cluster)}</td>
                  <td className="num text-end font-monospace">
                    {h.confidence_score ? `${(Number(h.confidence_score) * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className="text-end d-print-none">
                    <div className="d-inline-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleOpenHistoryDetail(h)}
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handlePromptDelete(h)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-5">
                    Belum ada data inferensi prediksi.
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
        title="Hasil Rekomendasi Kelayakan"
        subtitle="Analisis Algoritma Neural Network SPK Beasiswa"
        footer={
          <button type="button" className="btn btn-primary px-4" onClick={() => setIsResultModalOpen(false)}>
            Tutup
          </button>
        }
      >
        {result && (
          <div className="py-2 text-center">
            {result.student_name && (
              <div className="p-3 mb-3 bg-light rounded border">
                <span className="text-muted small d-block">Identitas Mahasiswa:</span>
                <h4 className="fw-bold mb-0 text-primary">{result.student_name}</h4>
                {result.student_code && <span className="font-monospace text-muted small">NIM: {result.student_code}</span>}
              </div>
            )}
            <div className="mb-3">{getStatusBadge(result.predicted_cluster)}</div>
            <p className="text-muted small font-monospace mb-0">
              Keyakinan: {result.confidence_score ? `${(Number(result.confidence_score) * 100).toFixed(2)}%` : '-'}
            </p>
          </div>
        )}
      </Modal>

      {/* POPUP MODAL: Detail Riwayat */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        size="md"
        title={`Rincian Calon Mahasiswa #${selectedHistoryItem?.id || ''}`}
        subtitle={`Waktu Uji: ${selectedHistoryItem?.created_at ? new Date(selectedHistoryItem.created_at).toLocaleString('id-ID') : '-'}`}
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>
            Tutup
          </button>
        }
      >
        {selectedHistoryItem && (
          <div>
            <div className="p-3 bg-light rounded border mb-3">
              <span className="text-muted small d-block">Nama Mahasiswa:</span>
              <h5 className="fw-bold mb-0 text-dark">{selectedHistoryItem.student_name || 'Tanpa Nama'}</h5>
              <span className="font-monospace text-muted small">NIM: {selectedHistoryItem.student_code || '-'}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded border">
              <div>
                <span className="text-muted small d-block">Status Keputusan:</span>
                <div className="mt-1">{getStatusBadge(selectedHistoryItem.predicted_cluster)}</div>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Model Versi</span>
                <span className="badge bg-secondary">v{selectedHistoryItem.model_version_id}</span>
              </div>
            </div>

            <ul className="list-group list-group-flush border rounded mb-3">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>IPK</span>
                <span className="fw-bold font-monospace">{Number(selectedHistoryItem.ipk).toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Penghasilan Orang Tua</span>
                <span className="fw-bold font-monospace">Rp {Number(selectedHistoryItem.parent_income).toLocaleString('id-ID')}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Jumlah Tanggungan</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.family_dependents} Orang</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Prestasi Akademik</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.academic_achievement_score}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Prestasi Non-Akademik</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.nonacademic_achievement_score}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Kehadiran</span>
                <span className="fw-bold font-monospace">{selectedHistoryItem.attendance_percentage}%</span>
              </li>
            </ul>

            {selectedHistoryItem.notes && (
              <div className="p-3 bg-light rounded border small">
                <strong>Catatan:</strong> {selectedHistoryItem.notes}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* POPUP MODAL: Konfirmasi Hapus */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleting && setIsDeleteModalOpen(false)}
        size="sm"
        title="Konfirmasi Hapus"
        subtitle="Data yang dihapus tidak dapat dipulihkan"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        }
      >
        <p className="mb-0">
          Hapus riwayat calon <strong>{deleteTarget?.student_name || `#${deleteTarget?.id}`}</strong>?
        </p>
      </Modal>
    </>
  );
}
