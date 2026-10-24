import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Row, Col, Table, FormGroup, Label, Input, Alert, Badge } from 'reactstrap';
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
      const items = res.data.items || res.data;
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
    <div>
      <PageTitle
        heading="Evaluasi Model Backpropagation"
        subheading="Confusion matrix, akurasi, presisi, recall, dan f1-score model jaringan saraf"
        icon="pe-7s-check icon-gradient bg-premium-dark"
      />

      <Alert color="warning" className="mb-4">
        <strong>Penting & Disclaimer Metrik:</strong> Target pelatihan Backpropagation adalah label cluster K-Means, 
        sehingga metrik evaluasi di bawah ini mengukur tingkat kemampuan jaringan saraf dalam mereproduksi dan memetakan pola cluster acuan.
        Metrik ini <em>bukan</em> ukuran kelayakan resmi penerima beasiswa kampus.
      </Alert>

      <Card className="main-card mb-3">
        <CardBody>
          <FormGroup className="mb-0">
            <Label for="modelSelect">Pilih Versi Model</Label>
            <Input
              type="select"
              id="modelSelect"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.model_name} (v{m.model_version}) - Status: {m.status}
                </option>
              ))}
            </Input>
          </FormGroup>
        </CardBody>
      </Card>

      {modelDetail && (
        <>
          <Row>
            <Col md={3}>
              <Card className="card-shadow-primary mb-3 widget-chart widget-chart2 text-start">
                <div className="widget-chat-wrapper-outer">
                  <div className="widget-chart-content">
                    <h6 className="widget-subheading">Akurasi Uji (Accuracy)</h6>
                    <div className="widget-numbers text-success">
                      {metrics.accuracy !== undefined ? (metrics.accuracy * 100).toFixed(2) + '%' : '-'}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-shadow-primary mb-3 widget-chart widget-chart2 text-start">
                <div className="widget-chat-wrapper-outer">
                  <div className="widget-chart-content">
                    <h6 className="widget-subheading">Macro Precision</h6>
                    <div className="widget-numbers text-primary">
                      {metrics.precision_macro !== undefined ? (metrics.precision_macro * 100).toFixed(2) + '%' : '-'}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-shadow-primary mb-3 widget-chart widget-chart2 text-start">
                <div className="widget-chat-wrapper-outer">
                  <div className="widget-chart-content">
                    <h6 className="widget-subheading">Macro Recall</h6>
                    <div className="widget-numbers text-info">
                      {metrics.recall_macro !== undefined ? (metrics.recall_macro * 100).toFixed(2) + '%' : '-'}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-shadow-primary mb-3 widget-chart widget-chart2 text-start">
                <div className="widget-chat-wrapper-outer">
                  <div className="widget-chart-content">
                    <h6 className="widget-subheading">Macro F1-Score</h6>
                    <div className="widget-numbers text-warning">
                      {metrics.f1_macro !== undefined ? (metrics.f1_macro * 100).toFixed(2) + '%' : '-'}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="main-card mb-3">
                <CardHeader>Confusion Matrix (Aktual vs Prediksi)</CardHeader>
                <CardBody>
                  {confusionMatrix.length > 0 ? (
                    <Table bordered responsive className="text-center">
                      <thead>
                        <tr>
                          <th>Aktual \ Prediksi</th>
                          {confusionMatrix.map((_, idx) => (
                            <th key={idx}>Cluster {idx}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {confusionMatrix.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="fw-bold">Cluster {rIdx}</td>
                            {row.map((val, cIdx) => (
                              <td
                                key={cIdx}
                                className={rIdx === cIdx ? 'bg-success text-white fw-bold' : ''}
                              >
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted text-center mb-0">Data confusion matrix tidak tersedia.</p>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="main-card mb-3">
                <CardHeader>Kinerja Metrik Per Cluster</CardHeader>
                <CardBody>
                  {Object.keys(perClass).length > 0 ? (
                    <Table bordered responsive hover>
                      <thead>
                        <tr>
                          <th>Cluster</th>
                          <th>Precision</th>
                          <th>Recall</th>
                          <th>F1-Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(perClass).map(([cls, scores]) => (
                          <tr key={cls}>
                            <td>
                              <Badge color="info">Cluster {cls}</Badge>
                            </td>
                            <td>{(scores.precision * 100).toFixed(2)}%</td>
                            <td>{(scores.recall * 100).toFixed(2)}%</td>
                            <td>{(scores.f1 * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted text-center mb-0">Rincian per kelas belum tercatat.</p>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
