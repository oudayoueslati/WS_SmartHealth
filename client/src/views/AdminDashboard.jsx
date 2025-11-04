import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Table,
  Badge,
  Button
} from "reactstrap";
import Header from "components/Headers/Header.js";
import { getAdminDashboard } from "../api";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'danger';
      case 'REFUNDED': return 'info';
      default: return 'secondary';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container className="mt--7" fluid>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Chargement...</span>
            </div>
            <p className="mt-3">Chargement du dashboard...</p>
          </div>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Container className="mt--7" fluid>
          <div className="alert alert-danger">
            <strong>Erreur:</strong> {error}
          </div>
        </Container>
      </>
    );
  }

  if (!dashboard) return null;

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        {/* Statistiques principales */}
        <Row>
          <Col lg="6" xl="3">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col">
                    <span className="h2 font-weight-bold mb-0">
                      {dashboard.payments?.total || 0}
                    </span>
                    <p className="mt-3 mb-0 text-muted text-sm">
                      <span className="text-nowrap">Total Paiements</span>
                    </p>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-gradient-red text-white rounded-circle shadow">
                      <i className="ni ni-credit-card" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col lg="6" xl="3">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col">
                    <span className="h2 font-weight-bold mb-0">
                      {formatCurrency(dashboard.payments?.totalRevenue)}
                    </span>
                    <p className="mt-3 mb-0 text-muted text-sm">
                      <span className="text-nowrap">Revenu Total</span>
                    </p>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-gradient-green text-white rounded-circle shadow">
                      <i className="ni ni-money-coins" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col lg="6" xl="3">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col">
                    <span className="h2 font-weight-bold mb-0">
                      {dashboard.services?.total || 0}
                    </span>
                    <p className="mt-3 mb-0 text-muted text-sm">
                      <span className="text-nowrap">Services Actifs</span>
                    </p>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-gradient-blue text-white rounded-circle shadow">
                      <i className="ni ni-briefcase-24" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col lg="6" xl="3">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col">
                    <span className="h2 font-weight-bold mb-0">
                      {dashboard.users?.total || 0}
                    </span>
                    <p className="mt-3 mb-0 text-muted text-sm">
                      <span className="text-nowrap">Utilisateurs</span>
                    </p>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-gradient-info text-white rounded-circle shadow">
                      <i className="ni ni-single-02" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Paiements par statut */}
        <Row className="mt-5">
          <Col xl="6">
            <Card className="shadow">
              <CardHeader className="border-0">
                <Row className="align-items-center">
                  <div className="col">
                    <h3 className="mb-0">Paiements par Statut</h3>
                  </div>
                </Row>
              </CardHeader>
              <CardBody>
                {dashboard.payments?.byStatus && dashboard.payments.byStatus.length > 0 ? (
                  <Table className="align-items-center table-flush" responsive>
                    <thead className="thead-light">
                      <tr>
                        <th>Statut</th>
                        <th>Nombre</th>
                        <th>Montant Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.payments.byStatus.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <Badge color={getStatusColor(item.status)} pill>
                              {item.status}
                            </Badge>
                          </td>
                          <td>{item.count}</td>
                          <td className="font-weight-bold">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">Aucune donnée disponible</p>
                )}
              </CardBody>
            </Card>
          </Col>

          {/* Services par type */}
          <Col xl="6">
            <Card className="shadow">
              <CardHeader className="border-0">
                <Row className="align-items-center">
                  <div className="col">
                    <h3 className="mb-0">Services par Type</h3>
                  </div>
                </Row>
              </CardHeader>
              <CardBody>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th>Type</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <Badge color="primary" pill>Consultations</Badge>
                      </td>
                      <td className="font-weight-bold">
                        {dashboard.services?.consultations || 0}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Badge color="success" pill>Analyses</Badge>
                      </td>
                      <td className="font-weight-bold">
                        {dashboard.services?.analyses || 0}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Badge color="info" pill>Télémédecine</Badge>
                      </td>
                      <td className="font-weight-bold">
                        {dashboard.services?.telemedicine || 0}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Paiements récents */}
        <Row className="mt-5">
          <Col>
            <Card className="shadow">
              <CardHeader className="border-0">
                <Row className="align-items-center">
                  <div className="col">
                    <h3 className="mb-0">Paiements Récents</h3>
                  </div>
                  <div className="col text-right">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={loadDashboard}
                    >
                      <i className="ni ni-refresh-02" /> Actualiser
                    </Button>
                  </div>
                </Row>
              </CardHeader>
              <CardBody>
                {dashboard.recentPayments && dashboard.recentPayments.length > 0 ? (
                  <Table className="align-items-center table-flush" responsive>
                    <thead className="thead-light">
                      <tr>
                        <th>ID</th>
                        <th>Utilisateur</th>
                        <th>Service</th>
                        <th>Montant</th>
                        <th>Date</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <code className="text-sm">{payment.id}</code>
                          </td>
                          <td>{payment.user || 'N/A'}</td>
                          <td>{payment.service || 'N/A'}</td>
                          <td className="font-weight-bold">
                            {formatCurrency(payment.montant)}
                          </td>
                          <td>{formatDate(payment.date)}</td>
                          <td>
                            <Badge color={getStatusColor(payment.status)} pill>
                              {payment.status || 'N/A'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">Aucun paiement récent</p>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminDashboard;
