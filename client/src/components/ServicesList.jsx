import React, { useEffect, useState } from 'react';
import { getServices, deleteService } from '../api';
import EditServiceModal from './EditServiceModal';
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  Button,
  Badge,
  UncontrolledTooltip
} from 'reactstrap';

export default function ServicesList({ onSelect }) {
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (e) {
      console.error(e);
      alert('❌ Erreur récupération services: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(s) {
    if (!window.confirm(`Voulez-vous vraiment supprimer le service "${s.label || s.id}" ?`)) return;
    const id = s.id || s.uri.split(/[#\/]/).pop();
    try {
      await deleteService(id);
      alert(' Service supprimé avec succès!');
      load();
    } catch (err) {
      alert(' Erreur lors de la suppression: ' + err.message);
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
    <>
      <Card className="shadow">
        <CardHeader className="border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="ni ni-bullet-list-67 text-primary" /> Liste des Services
              {services.length > 0 && (
                <Badge color="primary" className="ml-2">
                  {services.length}
                </Badge>
              )}
            </h3>
            <Button
              color="primary"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <i className="ni ni-refresh-02" /> Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Chargement...</span>
              </div>
              <p className="mt-3 text-muted">Chargement des services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-5">
              <i className="ni ni-folder-17" style={{ fontSize: '3rem', color: '#ccc' }} />
              <p className="mt-3 text-muted">Aucun service disponible</p>
              <p className="text-sm text-muted">Créez votre premier service avec le formulaire ci-contre</p>
            </div>
          ) : (
            <Table className="align-items-center table-flush" responsive>
              <thead className="thead-light">
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">ID</th>
                  <th scope="col">Libellé</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s, idx) => (
                  <tr key={s.id || s.uri}>
                    <td>
                      <Badge color={getTypeColor(s.type)} pill>
                        {getTypeIcon(s.type)} {s.type}
                      </Badge>
                    </td>
                    <td>
                      <code className="text-sm">{s.id}</code>
                    </td>
                    <td>
                      <span className="font-weight-600">{s.label || '-'}</span>
                    </td>
                    <td className="text-right">
                      <Button
                        color="info"
                        size="sm"
                        onClick={() => setEditing(s)}
                        id={`edit-${idx}`}
                      >
                        <i className="ni ni-ruler-pencil" />
                      </Button>
                      <UncontrolledTooltip target={`edit-${idx}`}>
                        Modifier
                      </UncontrolledTooltip>
                      {' '}
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(s)}
                        id={`delete-${idx}`}
                      >
                        <i className="ni ni-fat-remove" />
                      </Button>
                      <UncontrolledTooltip target={`delete-${idx}`}>
                        Supprimer
                      </UncontrolledTooltip>
                      {onSelect && (
                        <>
                          {' '}
                          <Button
                            color="success"
                            size="sm"
                            onClick={() => onSelect(s)}
                            id={`select-${idx}`}
                          >
                            <i className="ni ni-check-bold" />
                          </Button>
                          <UncontrolledTooltip target={`select-${idx}`}>
                            Sélectionner
                          </UncontrolledTooltip>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
      {editing && (
        <EditServiceModal
          service={editing}
          onClose={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}
