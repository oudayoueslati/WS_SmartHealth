import React, { useState, useEffect } from 'react';
import { createPayment, getServices, getUsers } from '../api';
import {
  Card,
  CardHeader,
  CardBody,
  Form,
  FormGroup,
  Input,
  Button,
  Label,
  Badge,
  Row,
  Col
} from 'reactstrap';

const PAYMENT_MODES = ['Carte', 'Espèces', 'Virement', 'Chèque', 'Assurance'];
const PAYMENT_STATUS = ['PAID', 'PENDING', 'FAILED', 'REFUNDED'];

export default function PaymentForm({ onSaved, defaultUser }) {
  const [user, setUser] = useState(defaultUser || '');
  const [service, setService] = useState('');
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState('Carte');
  const [status, setStatus] = useState('PAID');
  const [referenceFacture, setReferenceFacture] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const data = await getServices();
      setServices(data);
      if (data.length > 0 && !service) {
        setService(data[0].id);
      }
    } catch (err) {
      console.error('Erreur chargement services:', err);
      alert('❌ Erreur lors du chargement des services: ' + err.message);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getUsers();
      const usersList = response.users || [];
      setUsers(usersList);
      if (usersList.length > 0 && !user) {
        setUser(usersList[0].username);
      }
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      alert('❌ Erreur lors du chargement des utilisateurs: ' + err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadUsers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || !service || !montant) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      await createPayment({
        user,
        service,
        montant: parseFloat(montant),
        modePaiement,
        status,
        referenceFacture: referenceFacture || undefined,
        date
      });
      // Reset form
      setMontant('');
      setReferenceFacture('');
      setDate(new Date().toISOString().slice(0, 10));
      if (onSaved) onSaved();
      alert('✅ Paiement créé avec succès!');
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'danger';
      case 'REFUNDED': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PAID': return '✅';
      case 'PENDING': return '⏳';
      case 'FAILED': return '❌';
      case 'REFUNDED': return '↩️';
      default: return '📋';
    }
  };

  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-success">
        <h3 className="mb-0 text-white">
          <i className="ni ni-credit-card" /> Nouveau Paiement
        </h3>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Label for="paymentUser" className="mb-0">
                Utilisateur <span className="text-danger">*</span>
                {users.length > 0 && (
                  <Badge color="info" className="ml-2">
                    {users.length} disponible{users.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </Label>
              <Button
                color="link"
                size="sm"
                onClick={loadUsers}
                disabled={loadingUsers}
                className="p-0"
              >
                <i className="ni ni-refresh-02" /> Actualiser
              </Button>
            </div>
            <Input
              type="select"
              id="paymentUser"
              value={user}
              onChange={e => setUser(e.target.value)}
              required
              disabled={loadingUsers || loading}
            >
              <option value="">
                {loadingUsers ? '⏳ Chargement...' : '-- Sélectionner un utilisateur --'}
              </option>
              {users.map((u, index) => (
                <option key={`${u.username}_${u.email}_${index}`} value={u.username}>
                  {u.fullName || u.username} ({u.email})
                </option>
              ))}
            </Input>
            {!loadingUsers && users.length === 0 && (
              <small className="text-warning">
                ⚠️ Aucun utilisateur disponible. Créez-en un d'abord via l'inscription.
              </small>
            )}
          </FormGroup>

          <FormGroup>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Label for="paymentService" className="mb-0">
                Service <span className="text-danger">*</span>
                {services.length > 0 && (
                  <Badge color="info" className="ml-2">
                    {services.length} disponible{services.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </Label>
              <Button
                color="link"
                size="sm"
                onClick={loadServices}
                disabled={loadingServices}
                className="p-0"
              >
                <i className="ni ni-refresh-02" /> Actualiser
              </Button>
            </div>
            <Input
              type="select"
              id="paymentService"
              value={service}
              onChange={e => setService(e.target.value)}
              required
              disabled={loadingServices || loading}
            >
              <option value="">
                {loadingServices ? '⏳ Chargement...' : '-- Sélectionner un service --'}
              </option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.type}] {s.label || s.id}
                </option>
              ))}
            </Input>
            {!loadingServices && services.length === 0 && (
              <small className="text-warning">
                ⚠️ Aucun service disponible. Créez-en un d'abord dans la page Services.
              </small>
            )}
          </FormGroup>

          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="paymentAmount">
                  Montant (€) <span className="text-danger">*</span>
                </Label>
                <Input
                  type="number"
                  id="paymentAmount"
                  step="0.01"
                  min="0"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  placeholder="80.00"
                  required
                  disabled={loading}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="paymentDate">
                  Date
                </Label>
                <Input
                  type="date"
                  id="paymentDate"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="paymentMode">
                  Mode de paiement
                </Label>
                <Input
                  type="select"
                  id="paymentMode"
                  value={modePaiement}
                  onChange={e => setModePaiement(e.target.value)}
                  disabled={loading}
                >
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="paymentStatus">
                  Statut <Badge color={getStatusColor(status)}>{getStatusIcon(status)} {status}</Badge>
                </Label>
                <Input
                  type="select"
                  id="paymentStatus"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  disabled={loading}
                >
                  {PAYMENT_STATUS.map(st => (
                    <option key={st} value={st}>
                      {getStatusIcon(st)} {st}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label for="paymentRef">
              Référence facture <small className="text-muted">(optionnel)</small>
            </Label>
            <Input
              type="text"
              id="paymentRef"
              value={referenceFacture}
              onChange={e => setReferenceFacture(e.target.value)}
              placeholder="Ex: F2025-001"
              disabled={loading}
            />
          </FormGroup>

          <Button
            color="success"
            type="submit"
            block
            disabled={loading || !user || !service || !montant}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" />
                Création en cours...
              </>
            ) : (
              <>
                <i className="ni ni-check-bold" /> Créer le paiement
              </>
            )}
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
}
