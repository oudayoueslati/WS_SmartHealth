import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Form,
  FormGroup,
  Input,
  Button,
  Badge,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  Alert,
  Collapse
} from 'reactstrap';

export default function SmartServiceSearch({ onServiceSelect }) {
  const [query, setQuery] = useState('');
  const [userProfile, setUserProfile] = useState({
    age: '',
    weight: '',
    height: '',
    username: ''
  });
  const [showProfile, setShowProfile] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      alert('⚠️ Veuillez saisir une recherche');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch('http://localhost:5000/api/recommendations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userProfile: {
            age: userProfile.age ? parseInt(userProfile.age) : undefined,
            weight: userProfile.weight ? parseFloat(userProfile.weight) : undefined,
            height: userProfile.height ? parseFloat(userProfile.height) : undefined,
            username: userProfile.username || undefined
          },
          includeHistory: !!userProfile.username
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations || []);
        setSuggestions(data.suggestions || []);
      } else {
        alert('❌ Erreur: ' + data.error);
      }
    } catch (err) {
      alert('❌ Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
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

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Consultation': return '🩺';
      case 'Analyse': return '🔬';
      case 'Telemedecine': return '💻';
      default: return '📋';
    }
  };

  const exampleQueries = [
    "Je veux un service pour le stress",
    "Je cherche un suivi pour le diabète",
    "Consultation pour problème de peau",
    "Analyse de sang complète",
    "Quel service pour mon âge et mon IMC ?"
  ];

  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-info">
        <h3 className="mb-0 text-white">
          <i className="ni ni-bulb-61" /> Recherche Intelligente de Services
        </h3>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSearch}>
          {/* Barre de recherche principale */}
          <FormGroup>
            <div className="input-group">
              <Input
                type="text"
                placeholder="Ex: Je cherche un service pour le stress..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={loading}
                style={{ fontSize: '1.1rem' }}
              />
              <div className="input-group-append">
                <Button
                  color="info"
                  type="submit"
                  disabled={loading || !query.trim()}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <>
                      <i className="ni ni-zoom-split-in" /> Rechercher
                    </>
                  )}
                </Button>
              </div>
            </div>
          </FormGroup>

          {/* Exemples de recherche */}
          <div className="mb-3">
            <small className="text-muted d-block mb-2">
              <i className="ni ni-bulb-61" /> Exemples de recherche:
            </small>
            <div className="d-flex flex-wrap gap-2">
              {exampleQueries.map((example, idx) => (
                <Badge
                  key={idx}
                  color="light"
                  className="cursor-pointer"
                  style={{ cursor: 'pointer', padding: '0.5rem' }}
                  onClick={() => setQuery(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Profil utilisateur (optionnel) */}
          <div className="mb-3">
            <Button
              color="link"
              size="sm"
              onClick={() => setShowProfile(!showProfile)}
              className="p-0"
            >
              <i className={`ni ni-${showProfile ? 'bold-up' : 'bold-down'}`} />
              {' '}Ajouter mon profil pour des recommandations personnalisées
            </Button>
          </div>

          <Collapse isOpen={showProfile}>
            <Card className="bg-secondary shadow-none">
              <CardBody>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <label className="form-control-label">
                        Âge (années)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 35"
                        value={userProfile.age}
                        onChange={e => setUserProfile({...userProfile, age: e.target.value})}
                        disabled={loading}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <label className="form-control-label">
                        Poids (kg)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 70"
                        value={userProfile.weight}
                        onChange={e => setUserProfile({...userProfile, weight: e.target.value})}
                        disabled={loading}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <label className="form-control-label">
                        Taille (cm)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 175"
                        value={userProfile.height}
                        onChange={e => setUserProfile({...userProfile, height: e.target.value})}
                        disabled={loading}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <FormGroup>
                  <label className="form-control-label">
                    Nom d'utilisateur <small className="text-muted">(pour historique)</small>
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: nawrasse_elbenna"
                    value={userProfile.username}
                    onChange={e => setUserProfile({...userProfile, username: e.target.value})}
                    disabled={loading}
                  />
                </FormGroup>
              </CardBody>
            </Card>
          </Collapse>
        </Form>

        {/* Résultats */}
        {searched && (
          <div className="mt-4">
            {/* Suggestions intelligentes */}
            {suggestions.length > 0 && (
              <Alert color="info" className="mb-4">
                <h4 className="alert-heading">
                  <i className="ni ni-bulb-61" /> Suggestions intelligentes
                </h4>
                <ListGroup flush>
                  {suggestions.map((sug, idx) => (
                    <ListGroupItem key={idx} className="bg-transparent border-0 px-0">
                      <strong>{sug.suggestion}</strong>
                      <br />
                      <small className="text-muted">{sug.reason}</small>
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </Alert>
            )}

            {/* Recommandations */}
            {recommendations.length > 0 ? (
              <>
                <h4 className="mb-3">
                  <i className="ni ni-check-bold text-success" /> Services recommandés
                  <Badge color="success" className="ml-2">
                    {recommendations.length}
                  </Badge>
                </h4>
                <ListGroup>
                  {recommendations.map((service, idx) => (
                    <ListGroupItem
                      key={idx}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <Badge color={getTypeColor(service.type)} pill className="mr-2">
                            {getTypeIcon(service.type)} {service.type}
                          </Badge>
                          <strong>{service.label || service.id}</strong>
                        </div>
                        <small className="text-muted">
                          <i className="ni ni-bulb-61" /> {service.recommendationReason}
                        </small>
                        <br />
                        <Badge color="light" className="mt-1">
                          Score: {service.recommendationScore}
                        </Badge>
                      </div>
                      {onServiceSelect && (
                        <Button
                          color="success"
                          size="sm"
                          onClick={() => onServiceSelect(service)}
                        >
                          <i className="ni ni-check-bold" /> Sélectionner
                        </Button>
                      )}
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </>
            ) : (
              <Alert color="warning">
                <i className="ni ni-fat-remove" /> Aucun service trouvé pour cette recherche.
                <br />
                <small>Essayez avec d'autres mots-clés ou consultez les exemples ci-dessus.</small>
              </Alert>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
