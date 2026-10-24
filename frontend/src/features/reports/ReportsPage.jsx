import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Table, Button, Badge, Row, Col } from 'reactstrap';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = () => {
    setLoading(true);
    apiClient
      .get(API.REPORTS.EXPERIMENTS)
      .then((res) => setReport(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleExportPredictions = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${API.REPORTS.EXPORT_PREDICTIONS}`, '_blank');
  };

  return (
    <div>
      <PageTitle
        heading="Laporan & Riwayat Eksperimen"
        subheading="Ringkasan siklus eksperimen data mining dan ekspor hasil inferensi"
        icon="pe-7s-note2 icon-gradient bg-premium-dark"
      />

      <Row className="mb-3">
        <Col className="text-end">
          <Button color="success" onClick={handleExportPredictions}>
            <i className="pe-7s-download me-2"></i> Ekspor Prediksi (CSV)
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="main-card mb-3">
            <CardHeader>Daftar Eksperimen Clustering K-Means</CardHeader>
            <CardBody>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Preprocess ID</th>
                    <th>K</th>
                    <th>DBI Score</th>
                    <th>Status</th>
                    <th>Terpilih</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.clusters?.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.preprocessing_run_id}</td>
                      <td>{c.k_value}</td>
                      <td>{c.dbi_score !== null ? Number(c.dbi_score).toFixed(4) : '-'}</td>
                      <td>
                        <Badge color={c.status === 'completed' ? 'success' : 'secondary'}>{c.status}</Badge>
                      </td>
                      <td>
                        {c.is_selected ? (
                          <Badge color="success">Ya</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!report?.clusters || report.clusters.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">Belum ada clustering run</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="main-card mb-3">
            <CardHeader>Versi Model Backpropagation</CardHeader>
            <CardBody>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Versi</th>
                    <th>Target Cluster</th>
                    <th>Akurasi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.models?.map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.name}</td>
                      <td>v{m.version}</td>
                      <td>Run #{m.target_clustering_run_id}</td>
                      <td>
                        {m.metrics?.accuracy !== undefined
                          ? (m.metrics.accuracy * 100).toFixed(1) + '%'
                          : '-'}
                      </td>
                      <td>
                        <Badge color={m.status === 'ready' ? 'success' : 'warning'}>{m.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {(!report?.models || report.models.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">Belum ada model dilatih</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
