import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Row, Col, Button, Form, FormGroup, Label, Input, Alert, Table, Badge } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

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

  useEffect(() => {
    apiClient.get(API.MODELS.LIST).then((res) => {
      const items = res.data.items || res.data;
      const readyModels = items.filter((m) => m.status === 'ready');
      setModels(readyModels);
      if (readyModels.length > 0) {
        setSelectedModelId(readyModels[0].id);
      }
    });
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    apiClient.get(API.PREDICTIONS.LIST).then((res) => {
      setHistory(res.data.items || res.data);
    });
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
        toast.success('Prediksi berhasil dijalankan!');
        fetchHistory();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal memproses prediksi');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <PageTitle
        heading="Prediksi Kelayakan Beasiswa"
        subheading="Inferensi data mahasiswa baru menggunakan model Backpropagation aktif"
        icon="pe-7s-magic-wand icon-gradient bg-premium-dark"
      />

      <Alert color="info" className="mb-4">
        <strong>Disclaimer Keputusan:</strong> Hasil prediksi ini menunjukkan klasifikasi ke dalam pola 
        <strong> Cluster Hasil Data Mining</strong>, bukan penentuan keputusan mutlak penerimaan beasiswa. 
        Penerimaan resmi tetap berada pada wewenang pihak kampus / penelaah beasiswa.
      </Alert>

      {models.length === 0 && (
        <Alert color="danger" className="mb-4">
          Tidak ada model berstatus <strong>ready</strong>. Silakan latih model pada menu Training dan tandai sebagai 'ready' sebelum melakukan inferensi data baru.
        </Alert>
      )}

      <Row>
        <Col md={6}>
          <Card className="main-card mb-3">
            <CardHeader>Form Input 6 Variabel Mahasiswa</CardHeader>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="model_select">Model Aktif</Label>
                  <Input
                    type="select"
                    id="model_select"
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    disabled={models.length === 0}
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model_name} (v{m.model_version})
                      </option>
                    ))}
                  </Input>
                </FormGroup>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>IPK (0.00 - 4.00)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        name="ipk"
                        value={formData.ipk}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 3.65"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Penghasilan Orang Tua (Rp)</Label>
                      <Input
                        type="number"
                        min="0"
                        name="parent_income"
                        value={formData.parent_income}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 1500000"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Jumlah Tanggungan</Label>
                      <Input
                        type="number"
                        min="0"
                        name="family_dependents"
                        value={formData.family_dependents}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 3"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Persentase Kehadiran (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        name="attendance_percentage"
                        value={formData.attendance_percentage}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 95.0"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Skor Prestasi Akademik</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        name="academic_achievement_score"
                        value={formData.academic_achievement_score}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 2.0"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Skor Prestasi Nonakademik</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        name="nonacademic_achievement_score"
                        value={formData.nonacademic_achievement_score}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 1.0"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label>Catatan / Nama Mahasiswa (Opsional)</Label>
                  <Input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Contoh: Kandidat MHS-2026-001"
                  />
                </FormGroup>

                <Button color="primary" type="submit" disabled={loading || models.length === 0}>
                  {loading ? 'Memproses...' : 'Prediksi Pola Kelayakan'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="main-card mb-3">
            <CardHeader>Hasil Prediksi</CardHeader>
            <CardBody>
              {result ? (
                <div className="text-center py-4">
                  <h4 className="text-muted">Hasil Klasifikasi Jaringan Saraf</h4>
                  <div className="my-3">
                    <Badge color="success" className="p-3 fs-4">
                      Cluster {result.predicted_cluster}
                    </Badge>
                  </div>
                  {result.confidence_score !== undefined && (
                    <p className="lead">
                      Confidence Score: <strong>{(result.confidence_score * 100).toFixed(2)}%</strong>
                    </p>
                  )}
                  <p className="text-muted small">
                    Model Version ID: {result.model_version_id} | Waktu: {new Date(result.created_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-muted text-center py-5">
                  Masukkan data pada formulir di sebelah kiri dan klik tombol prediksi untuk melihat cluster yang dihasilkan.
                </p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="main-card mb-3">
        <CardHeader>Riwayat Prediksi Terbaru</CardHeader>
        <CardBody>
          <Table responsive hover bordered>
            <thead>
              <tr>
                <th>ID</th>
                <th>IPK</th>
                <th>Penghasilan</th>
                <th>Tanggungan</th>
                <th>Akademik</th>
                <th>Nonakademik</th>
                <th>Kehadiran</th>
                <th>Cluster Prediksi</th>
                <th>Confidence</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{h.ipk}</td>
                  <td>Rp {Number(h.parent_income).toLocaleString('id-ID')}</td>
                  <td>{h.family_dependents}</td>
                  <td>{h.academic_achievement_score}</td>
                  <td>{h.nonacademic_achievement_score}</td>
                  <td>{h.attendance_percentage}%</td>
                  <td>
                    <Badge color="primary">Cluster {h.predicted_cluster}</Badge>
                  </td>
                  <td>{h.confidence_score ? (h.confidence_score * 100).toFixed(1) + '%' : '-'}</td>
                  <td>{new Date(h.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-muted">
                    Belum ada riwayat prediksi.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
