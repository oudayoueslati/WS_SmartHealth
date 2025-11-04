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
  Button,
  Input,
  FormGroup,
  Label
} from "reactstrap";
import Header from "components/Headers/Header.js";
import { getAllPayments, deletePayment } from "../api";
import EditPaymentModal from "components/EditPaymentModal";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  
  // Filtres
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    searchUser: '',
    searchService: ''
  });

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, filters]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await getAllPayments({ limit: 500 });
      setPayments(data);
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
      alert('❌ Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.startDate) {
      filtered = filtered.filter(p => p.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(p => p.date <= filters.endDate);
    }
    if (filters.minAmount) {
      filtered = filtered.filter(p => p.montant >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(p => p.montant <= parseFloat(filters.maxAmount));
    }
    if (filters.searchUser) {
      filtered = filtered.filter(p => 
        p.user?.toLowerCase().includes(filters.searchUser.toLowerCase())
      );
    }
    if (filters.searchService) {
      filtered = filtered.filter(p => 
        p.service?.toLowerCase().includes(filters.searchService.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      searchUser: '',
      searchService: ''
    });
  };

  const handleDelete = async (payment) => {
    if (!window.confirm(`Supprimer le paiement ${payment.id} ?`)) return;
    try {
      await deletePayment(payment.id);
      alert('✅ Paiement supprimé');
      loadPayments();
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
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

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.montant || 0), 0);

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        {/* Filtres */}
        <Card className="shadow mb-4">
          <CardHeader>
            <Row className="align-items-center">
              <Col>
                <h3 className="mb-0">
                  <i className="ni ni-settings" /> Filtres
                </h3>
              </Col>
              <Col className="text-right">
                <Button color="secondary" size="sm" onClick={resetFilters}>
                  <i className="ni ni-fat-remove" /> Réinitialiser
                </Button>
              </Col>
            </Row>
          </CardHeader>
          <CardBody>
            <Row>
              <Col md="3">
                <FormGroup>
                  <Label for="filterStatus">Statut</Label>
                  <Input
                    type="select"
                    id="filterStatus"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md="3">
                <FormGroup>
                  <Label for="filterStartDate">Date début</Label>
                  <Input
                    type="date"
                    id="filterStartDate"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="3">
                <FormGroup>
                  <Label for="filterEndDate">Date fin</Label>
                  <Input
                    type="date"
                    id="filterEndDate"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="3">
                <FormGroup>
                  <Label for="filterUser">Utilisateur</Label>
                  <Input
                    type="text"
                    id="filterUser"
                    placeholder="Rechercher..."
                    value={filters.searchUser}
                    onChange={(e) => handleFilterChange('searchUser', e.target.value)}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="3">
                <FormGroup>
                  <Label for="filterMinAmount">Montant min (€)</Label>
                  <Input
                    type="number"
                    id="filterMinAmount"
                    step="0.01"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="3">
                <FormGroup>
                  <Label for="filterMaxAmount">Montant max (€)</Label>
                  <Input
                    type="number"
                    id="filterMaxAmount"
                    step="0.01"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="3">
                <FormGroup>
                  <Label for="filterService">Service</Label>
                  <Input
                    type="text"
                    id="filterService"
                    placeholder="Rechercher..."
                    value={filters.searchService}
                    onChange={(e) => handleFilterChange('searchService', e.target.value)}
                  />
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Liste des paiements */}
        <Card className="shadow">
          <CardHeader className="border-0">
            <Row className="align-items-center">
              <Col>
                <h3 className="mb-0">
                  <i className="ni ni-credit-card" /> Tous les Paiements
                  <Badge color="primary" className="ml-2">
                    {filteredPayments.length}
                  </Badge>
                </h3>
                <p className="text-sm text-muted mb-0 mt-2">
                  Total: <strong>{formatCurrency(totalAmount)}</strong>
                </p>
              </Col>
              <Col className="text-right">
                <Button
                  color="primary"
                  size="sm"
                  onClick={loadPayments}
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
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-5">
                <i className="ni ni-folder-17" style={{ fontSize: '3rem', color: '#ccc' }} />
                <p className="mt-3 text-muted">Aucun paiement trouvé</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="align-items-center table-flush" hover>
                  <thead className="thead-light">
                    <tr>
                      <th>ID</th>
                      <th>Utilisateur</th>
                      <th>Service</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Référence</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <code className="text-sm">{payment.id}</code>
                        </td>
                        <td>
                          <span className="font-weight-600">
                            {payment.user || 'N/A'}
                          </span>
                        </td>
                        <td>{payment.service || 'N/A'}</td>
                        <td className="font-weight-bold">
                          {formatCurrency(payment.montant)}
                        </td>
                        <td>
                          <Badge color="secondary" pill>
                            {payment.modePaiement || 'N/A'}
                          </Badge>
                        </td>
                        <td>{formatDate(payment.date)}</td>
                        <td>
                          <Badge color={getStatusColor(payment.status)} pill>
                            {payment.status || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <small>{payment.referenceFacture || '-'}</small>
                        </td>
                        <td className="text-right">
                          <Button
                            color="info"
                            size="sm"
                            onClick={() => setEditing(payment)}
                          >
                            <i className="ni ni-ruler-pencil" />
                          </Button>
                          {' '}
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(payment)}
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
      </Container>

      {editing && (
        <EditPaymentModal
          payment={editing}
          onClose={() => {
            setEditing(null);
            loadPayments();
          }}
        />
      )}
    </>
  );
};

export default AdminPayments;
