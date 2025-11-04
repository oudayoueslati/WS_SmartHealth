import React, { useState } from 'react';
import { createService } from '../api';
import {
  Card,
  CardHeader,
  CardBody,
  Form,
  FormGroup,
  Input,
  Button,
  Label,
  Badge
} from 'reactstrap';

// types possibles (fixés par ton ontologie)
const SERVICE_TYPES = ['Consultation','Analyse','Telemedecine'];

export default function ServiceForm({ onSaved }) {
  const [type, setType] = useState('Consultation');
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) {
      alert('Le label est requis');
      return;
    }
    setLoading(true);
    try {
      await createService({ id: id || undefined, type, label });
      setId(''); 
      setLabel('');
      if (onSaved) onSaved();
      alert(' Service créé avec succès!');
    } catch (err) {
      alert(' Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'Consultation': return 'primary';
      case 'Analyse': return 'success';
      case 'Telemedecine': return 'info';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Consultation': return '';
      case 'Analyse': return '';
      case 'Telemedecine': return '';
      default: return '';
    }
  };

  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-primary">
        <h3 className="mb-0 text-white">
          <i className="ni ni-fat-add" /> Nouveau Service Médical
        </h3>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label for="serviceType">
              Type de service <Badge color={getTypeColor(type)}>{getTypeIcon(type)} {type}</Badge>
            </Label>
            <Input
              type="select"
              id="serviceType"
              value={type}
              onChange={e => setType(e.target.value)}
              disabled={loading}
            >
              {SERVICE_TYPES.map(t => (
                <option key={t} value={t}>
                  {getTypeIcon(t)} {t}
                </option>
              ))}
            </Input>
          </FormGroup>

          <FormGroup>
            <Label for="serviceId">
              ID personnalisé <small className="text-muted">(optionnel)</small>
            </Label>
            <Input
              type="text"
              id="serviceId"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="Ex: Consultation_Cardio_001"
              disabled={loading}
            />
            <small className="text-muted">
              Si vide, un ID sera généré automatiquement
            </small>
          </FormGroup>

          <FormGroup>
            <Label for="serviceLabel">
              Libellé du service <span className="text-danger">*</span>
            </Label>
            <Input
              type="text"
              id="serviceLabel"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex: Consultation Cardiologie"
              required
              disabled={loading}
            />
          </FormGroup>

          <Button
            color="primary"
            type="submit"
            block
            disabled={loading || !label.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" />
                Création en cours...
              </>
            ) : (
              <>
                <i className="ni ni-check-bold" /> Créer le service
              </>
            )}
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
}
