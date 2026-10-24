import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function ImportPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(
    params.id || searchParams.get('dataset_id') || ''
  );

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [validation, setValidation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    apiClient
      .get(API.DATASETS.LIST)
      .then((res) => {
        const items = res.data.items || res.data || [];
        setDatasets(items);
        if (!selectedBatchId && items.length > 0) {
          setSelectedBatchId(items[0].id);
        }
      })
      .catch(() => {});
  }, [selectedBatchId]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const f = acceptedFiles[0];
      if (!f) return;
      if (!selectedBatchId) {
        toast.warning('Pilih batch dataset tujuan terlebih dahulu!');
        return;
      }

      setFile(f);
      setPreview(null);
      setValidation(null);
      setUploading(true);

      const formData = new FormData();
      formData.append('file', f);

      try {
        const res = await apiClient.post(
          API.DATASETS.IMPORT(selectedBatchId),
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { preview_only: true },
          }
        );
        setPreview(res.data.preview || []);
        setValidation(res.data.validation || null);
        toast.info('File diunggah untuk validasi. Tinjau data sebelum konfirmasi.');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Gagal mengunggah file data');
        setFile(null);
      } finally {
        setUploading(false);
      }
    },
    [selectedBatchId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleConfirm = async () => {
    if (!file || !selectedBatchId) return;
    setConfirming(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(API.DATASETS.IMPORT(selectedBatchId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Data mahasiswa berhasil diimpor ke dalam batch!');
      navigate(`/datasets/${selectedBatchId}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengonfirmasi impor data');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <PageTitle
        heading="Impor Dataset Mahasiswa"
        subheading="Unggah berkas pendaftar format CSV atau Excel untuk diproses dalam sistem SPK"
        eyebrow="Data Mahasiswa · SPK Beasiswa"
        actions={
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/datasets')}
          >
            &larr; Kembali ke Daftar
          </button>
        }
      />

      {/* Configuration & Batch Selection */}
      <section className="panel mb-4">
        <div className="panel-body">
          <div className="row align-items-center g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold" htmlFor="batchSelector">
                Pilih Batch Dataset Tujuan *
              </label>
              <select
                id="batchSelector"
                className="form-select"
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setFile(null);
                  setPreview(null);
                  setValidation(null);
                }}
              >
                <option value="">-- Pilih Batch Dataset --</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.record_count ?? 0} data) - Status: {d.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 text-md-end pt-md-4">
              <span className="text-muted small">
                Format yang didukung: <strong>.CSV</strong>, <strong>.XLSX</strong>, <strong>.XLS</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Drag & Drop Area */}
      <section className="panel mb-4">
        <div className="panel-body">
          <div
            {...getRootProps()}
            className={`p-5 text-center rounded border-2 border-dashed ${
              isDragActive ? 'bg-light border-primary' : 'border-secondary-subtle'
            }`}
            style={{
              cursor: 'pointer',
              borderStyle: 'dashed',
              backgroundColor: isDragActive ? 'var(--rg-primary-soft)' : 'var(--rg-surface-2)',
              transition: 'background-color 0.2s',
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="py-4">
                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                  style={{ width: '2.5rem', height: '2.5rem' }}
                />
                <p className="fw-semibold mb-0">Memeriksa struktur &amp; memvalidasi berkas...</p>
              </div>
            ) : isDragActive ? (
              <div className="py-4">
                <p className="text-primary fw-bold fs-5 mb-0">Lepaskan berkas di sini...</p>
              </div>
            ) : (
              <div className="py-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 56, height: 56, color: 'var(--rg-primary)' }}
                  className="mb-3"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <h3 className="h6 fw-bold mb-1">
                  Tarik dan letakkan file CSV / Excel di sini
                </h3>
                <p className="text-muted small mb-0">
                  atau klik untuk memilih file dari komputer Anda
                </p>
                {file && (
                  <div className="mt-3">
                    <span className="badge bg-success-subtle text-success fs-6 py-2 px-3 border border-success">
                      Berkas terpilih: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Validation Summary Cards */}
      {validation && (
        <section className="kpi-grid mb-4" aria-label="Hasil Validasi File">
          <div className="kpi">
            <div className="kpi-top">
              <span className="kpi-icon tone-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <p className="kpi-label">Baris Valid</p>
            </div>
            <p className="kpi-value text-success">{validation.valid_rows}</p>
            <p className="kpi-note">Siap diimpor ke sistem</p>
          </div>

          <div className="kpi">
            <div className="kpi-top">
              <span className="kpi-icon tone-danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </span>
              <p className="kpi-label">Baris Tidak Valid</p>
            </div>
            <p className="kpi-value text-danger">{validation.invalid_rows}</p>
            <p className="kpi-note">Mengandung kesalahan data/format</p>
          </div>

          <div className="kpi">
            <div className="kpi-top">
              <span className="kpi-icon tone-slate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </svg>
              </span>
              <p className="kpi-label">Total Baris</p>
            </div>
            <p className="kpi-value">{validation.total_rows}</p>
            <p className="kpi-note">Seluruh baris dalam dokumen</p>
          </div>
        </section>
      )}

      {/* Validation Errors If Any */}
      {validation?.errors && validation.errors.length > 0 && (
        <section className="panel mb-4">
          <div className="panel-head">
            <h2 className="panel-title text-danger">Catatan Kesalahan Validasi</h2>
          </div>
          <div className="panel-body">
            <ul className="list-group list-group-flush small">
              {validation.errors.slice(0, 10).map((err, i) => (
                <li key={i} className="list-group-item text-danger py-2">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Preview Data */}
      {preview && preview.length > 0 && (
        <section className="panel mb-4">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Pratinjau Data (10 Baris Pertama)</h2>
              <p className="panel-sub">
                Periksa kolom dan nilai data mahasiswa sebelum melanjutkan impor
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table-data table-compact">
              <thead>
                <tr>
                  {Object.keys(preview[0]).map((col) => (
                    <th key={col} scope="col">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="num">
                        {String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-foot justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setValidation(null);
              }}
            >
              Batal / Ganti Berkas
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={confirming || (validation && validation.valid_rows === 0)}
            >
              {confirming ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Mengimpor...
                </>
              ) : (
                'Konfirmasi & Simpan ke Dataset'
              )}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
