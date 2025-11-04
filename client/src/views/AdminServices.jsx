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
import { getServices, getServicesStats, deleteService } from "../api";
import ServiceForm from "components/ServiceForm";
import EditServiceModal from "components/EditServiceModal";

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesData, statsData] = await Promise.all([
        getServices(),
        getServicesStats()
      ]);
      setServices(servicesData);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      alert('❌ Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Supprimer le service "${service.label || service.id}" ?`)) return;
    try {
      await deleteService(service.id);
      alert('✅ Service supprimé');
      loadData();
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Consultation': return 'primary';
      case 'Analyse': return 'success';
      case 'Telemedecine': return 'info';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  // Enrichir les services avec leurs stats
  const enrichedServices = services.map(service => {
    const serviceStat = stats.find(s => s.service === service.id);
    return {
      ...service,
      totalPayments: serviceStat?.totalPayments || 0,
      totalRevenue: serviceStat?.totalRevenue || 0,
      avgRevenue: serviceStat?.avgRevenue || 0
    };
  });

  // Trier par revenu total
  const sortedServices = [...enrichedServices].sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = sortedServices.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalPayments = sortedServices.reduce((sum, s) => sum + s.totalPayments, 0);

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        {/* Statistiques globales */}
        <Row className="mb-4">
          <Col lg="4">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <div className="col">
                    <span className="h2 font-weight-bold mb-0">
                      {services.length}
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
          <Col lg="4">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <div className="col">
                    <span className="h2 font-weight-bold mb-0">
                      {totalPayments}
                    </span>
                    <p className="mt-3 mb-0 text-muted text-sm">
                      <span className="text-nowrap">Paiements Totaux</span>
                    </p>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-gradient-orange text-white rounded-circle shadow">
                      <i className="ni ni-credit-card" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <div className="col">
                    <span className="h2 font-weight-bold mb-0">
                      {formatCurrency(totalRevenue)}
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
        </Row>

        <Row>
          {/* Formulaire de création */}
          <Col lg="4">
            <ServiceForm onSaved={loadData} />
          </Col>

          {/* Liste des services avec stats */}
          <Col lg="8">
            <Card className="shadow">
              <CardHeader className="border-0">
                <Row className="align-items-center">
                  <Col>
                    <h3 className="mb-0">
                      <i className="ni ni-bullet-list-67" /> Services & Performances
                    </h3>
                  </Col>
                  <Col className="text-right">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={loadData}
                      disabled={loading}
                    >
                      <i className="ni ni-refresh-02" /> Actualiser
                    </Button>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Chargement...</span>
                    </div>
                  </div>
                ) : sortedServices.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ni ni-folder-17" style={{ fontSize: '3rem', color: '#ccc' }} />
                    <p className="mt-3 text-muted">Aucun service disponible</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-items-center table-flush" hover>
                      <thead className="thead-light">
                        <tr>
                          <th>Type</th>
                          <th>ID / Libellé</th>
                          <th>Paiements</th>
                          <th>Revenu Total</th>
                          <th>Revenu Moyen</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedServices.map((service, idx) => (
                          <tr key={service.id}>
                            <td>
                              <Badge color={getTypeColor(service.type)} pill>
                                {service.type}
                              </Badge>
                            </td>
                            <td>
                              <div>
                                <code className="text-sm">{service.id}</code>
                              </div>
                              <div className="text-sm text-muted">
                                {service.label || '-'}
                              </div>
                            </td>
                            <td>
                              <Badge color="secondary">
                                {service.totalPayments}
                              </Badge>
                            </td>
                            <td className="font-weight-bold">
                              {formatCurrency(service.totalRevenue)}
                            </td>
                            <td className="text-muted">
                              {formatCurrency(service.avgRevenue)}
                            </td>
                            <td className="text-right">
                              <Button
                                color="info"
                                size="sm"
                                onClick={() => setEditing(service)}
                                id={`edit-${idx}`}
                              >
                                <i className="ni ni-ruler-pencil" />
                              </Button>
                              {' '}
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleDelete(service)}
                                id={`delete-${idx}`}
                              >
                                <i className="ni ni-fat-remove" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Top 5 services par revenu */}
            {sortedServices.length > 0 && (
              <Card className="shadow mt-4">
                <CardHeader>
                  <h3 className="mb-0">
                    <i className="ni ni-chart-bar-32" /> Top 5 Services par Revenu
                  </h3>
                </CardHeader>
                <CardBody>
                  <Table className="align-items-center" responsive>
                    <thead className="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Service</th>
                        <th>Type</th>
                        <th>Revenu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedServices.slice(0, 5).map((service, idx) => (
                        <tr key={service.id}>
                          <td>
                            <Badge color={idx === 0 ? 'warning' : 'secondary'} pill>
                              {idx + 1}
                            </Badge>
                          </td>
                          <td className="font-weight-600">
                            {service.label || service.id}
                          </td>
                          <td>
                            <Badge color={getTypeColor(service.type)} pill>
                              {service.type}
                            </Badge>
                          </td>
                          <td className="font-weight-bold">
                            {formatCurrency(service.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {editing && (
        <EditServiceModal
          service={editing}
          onClose={() => {
            setEditing(null);
            loadData();
          }}
        />
      )}
    </>
  );
};

export default AdminServices;
