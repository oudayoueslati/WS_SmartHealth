import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
  Badge,
  Table,
  UncontrolledCollapse,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from "reactstrap";
import Header from "components/Headers/Header.js";

const API_URL = "http://localhost:5000/api/ai-sparql";

const AISparql = () => {
  // États pour l'AI
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // État de configuration
  const [apiConfig, setApiConfig] = useState(null);
  
  // Données CRUD
  const [programs, setPrograms] = useState([]);
  const [users, setUsers] = useState([]);
  const [objectifs, setObjectifs] = useState([]);
  const [services, setServices] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [showRelations, setShowRelations] = useState(false);
  
  // Form CRUD
  const [formData, setFormData] = useState({
    type: "Activity",
    name: "",
    description: "",
    duration: "",
    assignedToUserId: "",
    scoreId: "",
    serviceId: "",
    objectifId: ""
  });

  // Action intelligente
  const [smartAction, setSmartAction] = useState({
    action: "assign_program",
    programId: "",
    userId: "",
    newUserId: "",
    type: "Activite",
    name: "",
    description: "",
    duration: "",
    goals: "",
    creatorId: "admin"
  });

  // Onglets
  const [activeTab, setActiveTab] = useState("ai");
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    fetchConfig();
    fetchUsers();
    fetchPrograms();
    fetchSuggestions();
    fetchRelationsData();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/config`);
      if (response.data.success) {
        setApiConfig(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch config:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`); 
      if (response.data.success) {
        console.log(`✅ ${response.data.count} utilisateurs chargés dans le frontend`);
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${API_URL}/programs`);
      if (response.data.success) {
        console.log(`✅ ${response.data.count} programmes chargés dans le frontend`);
        setPrograms(response.data.programs);
      }
    } catch (err) {
      console.error("Failed to fetch programs:", err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/suggestions`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };

  const fetchRelationsData = async () => {
    try {
      setObjectifs([]);
      setServices([]);
    } catch (err) {
      console.error("Failed to fetch relations data:", err);
    }
  };

  const handleGenerateQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/generate`, {
        prompt,
        executeQuery: true
      });

      if (response.data.success) {
        setResult(response.data);
        setSuccess("✅ Requête générée et exécutée avec succès !");
        
        if (response.data.queryType === 'UPDATE') {
          fetchPrograms();
          fetchUsers();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la génération");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartAction = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/smart-action`, {
        action: smartAction.action,
        params: smartAction
      });

      if (response.data.success) {
        setResult(response.data);
        setSuccess(`✅ Action "${smartAction.action}" exécutée avec succès !`);
        fetchPrograms();
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'action");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (query) => {
    setPrompt(query);
    setActiveTab("ai");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getAPIStatusBadge = () => {
    if (!apiConfig) return <Badge color="secondary">Chargement...</Badge>;
    
    if (!apiConfig.groqConfigured) {
      return <Badge color="danger">❌ Groq non configurée</Badge>;
    }
    
    return <Badge color="success">🚀 Groq ({apiConfig.model})</Badge>;
  };

  const formatSparqlResult = (result) => {
    if (!result) return null;

    if (result.result?.type === 'UPDATE') {
      return (
        <Alert color="success">
          <strong>Opération réussie !</strong>
          <p className="mb-0">{result.result.message}</p>
        </Alert>
      );
    }

    if (result.result?.data?.results?.bindings) {
      const bindings = result.result.data.results.bindings;
      
      if (bindings.length === 0) {
        return <Alert color="info">Aucun résultat trouvé</Alert>;
      }

      const keys = Object.keys(bindings[0]);
      
      return (
        <Table size="sm" responsive hover>
          <thead>
            <tr>
              {keys.map(key => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bindings.map((binding, idx) => (
              <tr key={idx}>
                {keys.map(key => (
                  <td key={key}>
                    {binding[key]?.value?.split('/').pop() || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }

    return <pre className="bg-light p-3 rounded">{JSON.stringify(result.result, null, 2)}</pre>;
  };

  // CRUD Functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      type: "Activity",
      name: "",
      description: "",
      duration: "",
      assignedToUserId: "",
      scoreId: "",
      serviceId: "",
      objectifId: ""
    });
    setEditMode(false);
    setCurrentProgram(null);
    setShowRelations(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (program) => {
    setFormData({
      type: program.type.replace("Programme", ""),
      name: program.name,
      description: program.description,
      duration: program.duration,
      assignedToUserId: program.relations?.assignedTo || "",
      scoreId: program.relations?.score || "",
      serviceId: program.relations?.service || "",
      objectifId: program.relations?.objectif || ""
    });
    setCurrentProgram(program);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editMode) {
        await axios.put(`${API_URL}/programs/${currentProgram.id}`, formData);
        setSuccess("Programme mis à jour avec succès !");
      } else {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        await axios.post(`${API_URL}/programs/create`, {
          ...formData,
          userId: user.username || "admin",
        });
        setSuccess("Programme créé avec succès !");
      }
      
      setModalOpen(false);
      resetForm();
      fetchPrograms();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Opération échouée");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce programme ?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/programs/${id}`);
      setSuccess("Programme supprimé avec succès !");
      fetchPrograms();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Échec de la suppression du programme");
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "ProgrammeActivite":
        return "primary";
      case "ProgrammeSommeil":
        return "info";
      case "ProgrammeNutrition":
        return "success";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type) => {
    return type.replace("Programme", "");
  };

  const filteredPrograms = filterType === "All" 
    ? programs 
    : programs.filter(p => p.type === `Programme${filterType}`);

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}
        {success && <Alert color="success" toggle={() => setSuccess("")}>{success}</Alert>}

        {/* Configuration API */}
        <Row className="mb-3">
          <Col>
            <Card className="shadow">
              <CardBody className="py-3">
                <Row className="align-items-center">
                  <Col xs="4">
                    <span className="text-muted mr-2">API Status :</span>
                    {getAPIStatusBadge()}
                  </Col>
                  <Col xs="4" className="text-center">
                    <Badge color="primary">
                      👥 {users.length} utilisateurs
                    </Badge>
                    {" "}
                    <Badge color="info">
                      📋 {programs.length} programmes
                    </Badge>
                  </Col>
                  <Col xs="4" className="text-right">
                    {apiConfig?.ontologyLoaded && (
                      <Badge color="info">
                        📚 {apiConfig.classesCount} classes, {apiConfig.propertiesCount} propriétés
                      </Badge>
                    )}
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Onglets */}
        <Row>
          <Col>
            <Card className="shadow">
              <CardHeader>
                <Nav tabs>
                  <NavItem>
                    <NavLink
                      className={activeTab === "ai" ? "active" : ""}
                      onClick={() => setActiveTab("ai")}
                      style={{ cursor: 'pointer' }}
                    >
                      🤖 AI SPARQL
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === "crud" ? "active" : ""}
                      onClick={() => setActiveTab("crud")}
                      style={{ cursor: 'pointer' }}
                    >
                      📋 CRUD Programmes
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === "suggestions" ? "active" : ""}
                      onClick={() => setActiveTab("suggestions")}
                      style={{ cursor: 'pointer' }}
                    >
                      💡 Suggestions
                    </NavLink>
                  </NavItem>
                </Nav>
              </CardHeader>

              <CardBody>
                <TabContent activeTab={activeTab}>
                  {/* Onglet AI */}
                  <TabPane tabId="ai">
                    <Row>
                      <Col lg="8">
                        <h3 className="mb-3">🤖 Génération SPARQL avec AI</h3>
                        <Form onSubmit={handleGenerateQuery}>
                          <FormGroup>
                            <Label for="prompt">
                              <strong>Décrivez ce que vous voulez faire :</strong>
                            </Label>
                            <Input
                              type="textarea"
                              id="prompt"
                              rows="5"
                              placeholder="Exemples :
- Créer un programme de santé pour l'utilisateur user_123
- Assigner le programme program_456 à user_789
- Trouver tous les programmes de santé
- Créer un log d'habitude pour user_123
- Compter les programmes par utilisateur"
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              required
                            />
                          </FormGroup>

                          <Button
                            color="primary"
                            type="submit"
                            disabled={loading || !prompt}
                            size="lg"
                            block
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm mr-2" />
                                Génération en cours...
                              </>
                            ) : (
                              <>
                                <i className="ni ni-send mr-2" />
                                Générer et Exécuter
                              </>
                            )}
                          </Button>
                        </Form>

                        {result && (
                          <div className="mt-4">
                            <hr />
                            <h5>📊 Résultats :</h5>
                            
                            <div className="mb-3">
                              <Badge color="info" className="mr-2">
                                Type: {result.queryType}
                              </Badge>
                              <Button
                                color="link"
                                size="sm"
                                id="queryToggle"
                              >
                                Voir la requête SPARQL
                              </Button>
                            </div>

                            <UncontrolledCollapse toggler="#queryToggle">
                              <div style={{
                                backgroundColor: '#1e293b',
                                color: '#22d3ee',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                border: '2px solid #0ea5e9',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                              }}>
                                <pre className="mb-0" style={{ 
                                  whiteSpace: 'pre-wrap',
                                  color: '#22d3ee',
                                  fontSize: '14px',
                                  lineHeight: '1.6',
                                  fontFamily: 'Monaco, Consolas, monospace'
                                }}>
                                  {result.generatedQuery}
                                </pre>
                              </div>
                            </UncontrolledCollapse>

                            {formatSparqlResult(result)}
                          </div>
                        )}
                      </Col>

                      <Col lg="4">
                        <h3 className="mb-3">⚡ Actions Rapides</h3>
                        <FormGroup>
                          <Label for="action">Type d'action :</Label>
                          <Input
                            type="select"
                            id="action"
                            value={smartAction.action}
                            onChange={(e) => setSmartAction({
                              ...smartAction,
                              action: e.target.value
                            })}
                          >
                            <option value="assign_program">Assigner un programme</option>
                            <option value="create_and_assign">Créer et assigner</option>
                            <option value="find_user_programs">Programmes d'un utilisateur</option>
                            <option value="update_assignment">Modifier assignation</option>
                            <option value="remove_assignment">Retirer assignation</option>
                            <option value="find_unassigned_programs">Programmes non assignés</option>
                          </Input>
                        </FormGroup>

                        {smartAction.action === "assign_program" && (
                          <>
                            <FormGroup>
                              <Label>Programme :</Label>
                              <Input
                                type="select"
                                value={smartAction.programId}
                                onChange={(e) => setSmartAction({
                                  ...smartAction,
                                  programId: e.target.value
                                })}
                              >
                                <option value="">-- Sélectionner --</option>
                                {programs.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>

                            <FormGroup>
                              <Label>Utilisateur :</Label>
                              <Input
                                type="select"
                                value={smartAction.userId}
                                onChange={(e) => setSmartAction({
                                  ...smartAction,
                                  userId: e.target.value
                                })}
                              >
                                <option value="">-- Sélectionner --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>
                                    {u.username || u.id}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </>
                        )}

                        {smartAction.action === "create_and_assign" && (
                          <>
                            <FormGroup>
                              <Label>Nom :</Label>
                              <Input
                                type="text"
                                placeholder="Programme Cardio"
                                value={smartAction.name}
                                onChange={(e) => setSmartAction({
                                  ...smartAction,
                                  name: e.target.value
                                })}
                              />
                            </FormGroup>

                            <FormGroup>
                              <Label>Description :</Label>
                              <Input
                                type="textarea"
                                rows="2"
                                value={smartAction.description}
                                onChange={(e) => setSmartAction({
                                  ...smartAction,
                                  description: e.target.value
                                })}
                              />
                            </FormGroup>

                            <FormGroup>
                              <Label>Assigner à :</Label>
                              <Input
                                type="select"
                                value={smartAction.userId}
                                onChange={(e) => setSmartAction({
                                  ...smartAction,
                                  userId: e.target.value
                                })}
                              >
                                <option value="">-- Sélectionner --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>
                                    {u.username || u.id}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </>
                        )}

                        {(smartAction.action === "find_user_programs" || 
                          smartAction.action === "find_user_habits") && (
                          <FormGroup>
                            <Label>Utilisateur :</Label>
                            <Input
                              type="select"
                              value={smartAction.userId}
                              onChange={(e) => setSmartAction({
                                ...smartAction,
                                userId: e.target.value
                              })}
                            >
                              <option value="">-- Sélectionner --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.username || u.id}
                                </option>
                              ))}
                            </Input>
                          </FormGroup>
                        )}

                        <Button
                          color="success"
                          onClick={handleSmartAction}
                          disabled={loading}
                          block
                        >
                          {loading ? "Exécution..." : "Exécuter"}
                        </Button>
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Onglet CRUD */}
                  <TabPane tabId="crud">
                    <Row className="mb-3">
                      <Col xs="8">
                        <h3 className="mb-0">📋 Gestion des Programmes</h3>
                      </Col>
                      <Col xs="4" className="text-right">
                        <Button
                          color="primary"
                          onClick={openCreateModal}
                          size="sm"
                        >
                          <i className="ni ni-fat-add" /> Ajouter
                        </Button>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col>
                        <div className="btn-group" role="group">
                          <Button
                            color={filterType === "All" ? "primary" : "secondary"}
                            onClick={() => setFilterType("All")}
                            size="sm"
                          >
                            Tous ({programs.length})
                          </Button>
                          <Button
                            color={filterType === "Activite" ? "primary" : "secondary"}
                            onClick={() => setFilterType("Activite")}
                            size="sm"
                          >
                            Activité ({programs.filter(p => p.type === "ProgrammeActivite").length})
                          </Button>
                          <Button
                            color={filterType === "Sommeil" ? "info" : "secondary"}
                            onClick={() => setFilterType("Sommeil")}
                            size="sm"
                          >
                            Sommeil ({programs.filter(p => p.type === "ProgrammeSommeil").length})
                          </Button>
                          <Button
                            color={filterType === "Nutrition" ? "success" : "secondary"}
                            onClick={() => setFilterType("Nutrition")}
                            size="sm"
                          >
                            Nutrition ({programs.filter(p => p.type === "ProgrammeNutrition").length})
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    <Table className="align-items-center table-flush" responsive>
                      <thead className="thead-light">
                        <tr>
                          <th>Nom</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Durée</th>
                          <th>Relations</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrograms.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              Aucun programme trouvé
                            </td>
                          </tr>
                        ) : (
                          filteredPrograms.map((program) => (
                            <tr key={program.id}>
                              <td><strong>{program.name}</strong></td>
                              <td>
                                <Badge color={getTypeBadgeColor(program.type)}>
                                  {getTypeLabel(program.type)}
                                </Badge>
                              </td>
                              <td>{program.description || "-"}</td>
                              <td>{program.duration || "-"}</td>
                              <td>
                                <small>
                                  {program.relations?.assignedTo && (
                                    <Badge color="info" className="mr-1">
                                      👤 {program.relations.assignedTo}
                                    </Badge>
                                  )}
                                  {program.relations?.objectif && (
                                    <Badge color="warning" className="mr-1">
                                      🎯 {program.relations.objectif}
                                    </Badge>
                                  )}
                                </small>
                              </td>
                              <td>
                                <Button
                                  color="info"
                                  size="sm"
                                  onClick={() => openEditModal(program)}
                                >
                                  <i className="ni ni-settings" />
                                </Button>{" "}
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleDelete(program.id)}
                                >
                                  <i className="ni ni-fat-remove" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </TabPane>

                  {/* Onglet Suggestions */}
                  <TabPane tabId="suggestions">
                    <h3 className="mb-3">💡 Suggestions de requêtes</h3>
                    <Row>
                      {suggestions.map((category, idx) => (
                        <Col md="6" key={idx} className="mb-4">
                          <h5 className="text-uppercase text-muted">
                            {category.category}
                          </h5>
                          <ListGroup>
                            {category.queries.map((query, qIdx) => (
                              <ListGroupItem
                                key={qIdx}
                                action
                                onClick={() => handleSuggestionClick(query)}
                                style={{ cursor: 'pointer' }}
                              >
                                {query}
                              </ListGroupItem>
                            ))}
                          </ListGroup>
                        </Col>
                      ))}
                    </Row>
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Modal CRUD */}
        <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
          <ModalHeader toggle={() => setModalOpen(false)}>
            {editMode ? "Modifier le programme" : "Créer un nouveau programme"}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <FormGroup>
                <Label for="type">Type de programme *</Label>
                <Input
                  type="select"
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  disabled={editMode}
                >
                  <option value="Activity">Activité</option>
                  <option value="Sleep">Sommeil</option>
                  <option value="Nutrition">Nutrition</option>
                </Input>
              </FormGroup>

              <FormGroup>
                <Label for="name">Nom du programme *</Label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Entrez le nom"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label for="description">Description</Label>
                <Input
                  type="textarea"
                  name="description"
                  id="description"
                  placeholder="Entrez la description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </FormGroup>

              <Row>
                <Col md="12">
                  <FormGroup>
                    <Label for="duration">Durée</Label>
                    <Input
                      type="text"
                      name="duration"
                      id="duration"
                      placeholder="ex: 4 semaines"
                      value={formData.duration}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <hr />
              <h5 className="mb-3">
                <Button
                  color="link"
                  size="sm"
                  onClick={() => setShowRelations(!showRelations)}
                >
                  {showRelations ? "▼" : "▶"} Relations (Optionnel)
                </Button>
              </h5>

              {showRelations && (
                <>
                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="assignedToUserId">Assigner à</Label>
                        <Input
                          type="select"
                          name="assignedToUserId"
                          id="assignedToUserId"
                          value={formData.assignedToUserId}
                          onChange={handleInputChange}
                        >
                          <option value="">-- Sélectionner --</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.username || user.id} {user.email && `(${user.email})`}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label for="objectifId">Objectif</Label>
                        <Input
                          type="select"
                          name="objectifId"
                          id="objectifId"
                          value={formData.objectifId}
                          onChange={handleInputChange}
                        >
                          <option value="">-- Sélectionner --</option>
                          {objectifs.map(obj => (
                            <option key={obj.id} value={obj.id}>
                              {obj.name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="serviceId">Service Médical</Label>
                        <Input
                          type="select"
                          name="serviceId"
                          id="serviceId"
                          value={formData.serviceId}
                          onChange={handleInputChange}
                        >
                          <option value="">-- Sélectionner --</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>
                              {service.name} ({service.type})
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <FormGroup>
                    <Label for="scoreId">Score Santé ID</Label>
                    <Input
                      type="text"
                      name="scoreId"
                      id="scoreId"
                      placeholder="ex: score_1"
                      value={formData.scoreId}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button color="primary" type="submit">
                {editMode ? "Mettre à jour" : "Créer"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

export default AISparql;