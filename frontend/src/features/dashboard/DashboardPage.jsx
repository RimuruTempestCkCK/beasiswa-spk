import { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody } from 'reactstrap';
import CountUp from 'react-countup';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

const StatCard = ({ title, value, icon, color, prefix = '', suffix = '' }) => (
  <Card className="mb-3 widget-chart widget-chart2 text-start card">
    <CardBody>
      <div className="widget-chat-wrapper-outer">
        <div className="widget-chart-content">
          <div className="widget-chart-flex">
            <div className="widget-numbers">
              <div className="widget-chart-flex">
                <div>
                  <CountUp
                    start={0}
                    end={value || 0}
                    separator=","
                    decimals={0}
                    duration={2}
                    prefix={prefix}
                    suffix={suffix}
                    className={`text-${color}`}
                  />
                </div>
              </div>
            </div>
          </div>
          <h6 className="widget-subheading mb-0 opacity-5">{title}</h6>
        </div>
        <div className="widget-chart-sidebar ps-2">
          <div className={`icon-wrapper rounded-circle bg-${color} text-white`}>
            <i className={`${icon} icon-gradient bg-${color}`} style={{ fontSize: '2rem' }} />
          </div>
        </div>
      </div>
    </CardBody>
  </Card>
);

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(API.DASHBOARD.SUMMARY)
      .then((res) => setSummary(res.data))
      .catch(() => toast.error('Gagal memuat data dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageTitle
        heading="Dashboard"
        subheading="Ringkasan statistik sistem SPK Beasiswa"
        icon="pe-7s-graph1 icon-gradient bg-mean-fruit"
      />
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : !summary ? (
        <div className="alert alert-info">
          <i className="pe-7s-info me-2" />
          Belum ada data. Mulai dengan membuat dataset batch pertama.
        </div>
      ) : (
        <>
          <Row>
            <Col md={6} xl={3}>
              <StatCard
                title="Total Dataset Batch"
                value={summary.total_datasets}
                icon="pe-7s-folder"
                color="primary"
              />
            </Col>
            <Col md={6} xl={3}>
              <StatCard
                title="Total Record Mahasiswa"
                value={summary.total_records}
                icon="pe-7s-users"
                color="success"
              />
            </Col>
            <Col md={6} xl={3}>
              <StatCard
                title="Eksperimen Clustering"
                value={summary.total_clustering_runs}
                icon="pe-7s-target"
                color="warning"
              />
            </Col>
            <Col md={6} xl={3}>
              <StatCard
                title="Model Aktif (Ready)"
                value={summary.active_models}
                icon="pe-7s-cpu"
                color="danger"
              />
            </Col>
          </Row>

          <Row className="mt-2">
            <Col md={6}>
              <Card>
                <CardBody>
                  <h5 className="card-title">Batch Dataset Terbaru</h5>
                  {summary.recent_datasets && summary.recent_datasets.length > 0 ? (
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Nama Batch</th>
                          <th>Records</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recent_datasets.map((d) => (
                          <tr key={d.id}>
                            <td>{d.name}</td>
                            <td>{d.record_count}</td>
                            <td>
                              <span
                                className={`badge bg-${
                                  d.status === 'validated'
                                    ? 'success'
                                    : d.status === 'imported'
                                      ? 'info'
                                      : d.status === 'rejected'
                                        ? 'danger'
                                        : 'secondary'
                                }`}
                              >
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">Belum ada dataset.</p>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <CardBody>
                  <h5 className="card-title">Model Terbaru</h5>
                  {summary.recent_models && summary.recent_models.length > 0 ? (
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Versi</th>
                          <th>Akurasi</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recent_models.map((m) => (
                          <tr key={m.id}>
                            <td>{m.version}</td>
                            <td>{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '-'}</td>
                            <td>
                              <span
                                className={`badge bg-${m.status === 'ready' ? 'success' : m.status === 'training' ? 'warning' : 'secondary'}`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">Belum ada model.</p>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
