import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDropzone } from 'react-dropzone';
import { Card, CardBody, Button, Alert } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function ImportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [validation, setValidation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setValidation(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', f);

    try {
      const res = await apiClient.post(API.DATASETS.IMPORT(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { preview_only: true },
      });
      setPreview(res.data.preview || []);
      setValidation(res.data.validation || null);
      toast.info('File diupload. Tinjau data sebelum konfirmasi.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengupload file');
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, [id]);

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
    if (!file) return;
    setConfirming(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(API.DATASETS.IMPORT(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Data berhasil diimport!');
      navigate(`/datasets/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengkonfirmasi import');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <PageTitle
        heading="Import Dataset"
        subheading="Upload file CSV atau Excel untuk dataset"
        icon="pe-7s-upload icon-gradient bg-mean-fruit"
      />

      <Card className="mb-3">
        <CardBody>
          <div
            {...getRootProps()}
            className={`dropzone-area border-2 border-dashed rounded p-5 text-center cursor-pointer ${
              isDragActive ? 'border-primary bg-light' : 'border-secondary'
            }`}
            style={{ cursor: 'pointer', border: '2px dashed #ccc' }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div>
                <div className="spinner-border text-primary mb-3" />
                <p>Mengupload file...</p>
              </div>
            ) : isDragActive ? (
              <p className="text-primary fw-bold">Lepaskan file di sini...</p>
            ) : (
              <div>
                <i className="pe-7s-cloud-upload" style={{ fontSize: '3rem', color: '#aaa' }} />
                <p className="mt-2 mb-1">Drag &amp; drop file CSV/XLSX di sini</p>
                <p className="text-muted small">atau klik untuk memilih file</p>
                {file && <p className="text-success mt-2">File: <strong>{file.name}</strong></p>}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {validation && (
        <Card className="mb-3">
          <CardBody>
            <h5>Ringkasan Validasi</h5>
            <div className="row">
              <div className="col-md-4">
                <Alert color="success">
                  <strong>Valid Rows:</strong> {validation.valid_rows}
                </Alert>
              </div>
              <div className="col-md-4">
                <Alert color="danger">
                  <strong>Invalid Rows:</strong> {validation.invalid_rows}
                </Alert>
              </div>
              <div className="col-md-4">
                <Alert color="info">
                  <strong>Total Rows:</strong> {validation.total_rows}
                </Alert>
              </div>
            </div>
            {validation.errors && validation.errors.length > 0 && (
              <>
                <h6 className="text-danger mt-2">Error:</h6>
                <ul className="list-group">
                  {validation.errors.slice(0, 10).map((e, i) => (
                    <li key={i} className="list-group-item list-group-item-danger small">
                      {e}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {preview && preview.length > 0 && (
        <Card className="mb-3">
          <CardBody>
            <h5>Preview Data (10 Baris Pertama)</h5>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    {Object.keys(preview[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <Button color="secondary" className="me-2" onClick={() => navigate(`/datasets/${id}`)}>
                Batal
              </Button>
              <Button
                color="success"
                onClick={handleConfirm}
                disabled={confirming || (validation && validation.valid_rows === 0)}
              >
                {confirming ? 'Mengkonfirmasi...' : 'Konfirmasi & Simpan'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
