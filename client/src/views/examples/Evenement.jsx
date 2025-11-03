import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Button,
  Alert,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  InputGroup,
  InputGroupText,
  ButtonGroup,
} from "reactstrap";
import Header from "components/Headers/Header.js";

const EvenementForm = () => {
  const [formData, setFormData] = useState({
    psDateDebut: "",
    psDateFin: "",
    psStatus: "",
    psDescription: "",
    aTitle: "",
    aLocalisation: ""
  });
  const [alert, setAlert] = useState({ visible: false, message: "", color: "" });
  const [evenements, setEvenements] = useState([]);
  const [filteredEvenements, setFilteredEvenements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editingEvenement, setEditingEvenement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // États pour l'AI
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    fetchEvenements();
  }, []);

  useEffect(() => {
    filterEvenements();
  }, [searchTerm, evenements, sortConfig, activeFilters]);

  const fetchEvenements = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/evenements');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("📦 Données reçues:", result);
      setEvenements(result.results.bindings || []);
    } catch (error) {
      console.error("❌ Erreur fetch:", error);
      showAlert("Erreur lors du chargement des événements: " + error.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour appliquer les filtres AI
  const applyAIFilters = (filters) => {
    if (!filters || filters.length === 0) {
      setActiveFilters([]);
      return;
    }

    setActiveFilters(filters);
    
    const filterDescriptions = filters.map(f => 
      f.description || `${f.field} ${f.operator} ${f.value}`
    );
    showAlert(`🎯 Filtres AI appliqués: ${filterDescriptions.join(', ')}`, "success");
  };

  // Fonction pour exécuter la création automatique
  const executeAICreate = async (aiResult) => {
    try {
      const response = await fetch('http://localhost:5000/api/evenements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          psDateDebut: aiResult.data.psDateDebut || new Date().toISOString().split('T')[0],
          psDateFin: aiResult.data.psDateFin || new Date().toISOString().split('T')[0],
          psStatus: aiResult.data.psStatus || "Planifié",
          psDescription: aiResult.data.psDescription || "",
          aTitle: aiResult.data.aTitle || "Nouvel Événement",
          aLocalisation: aiResult.data.aLocalisation || "Non spécifié"
        })
      });

      if (response.ok) {
        showAlert("✅ Événement créé automatiquement avec succès!", "success");
        fetchEvenements();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création automatique');
      }
    } catch (error) {
      showAlert("❌ Erreur création automatique: " + error.message, "danger");
    }
  };

  // Fonction pour exécuter l'édition automatique
  const executeAIUpdate = async (aiResult, originalQuestion) => {
    try {
      // Trouver l'événement à modifier
      let evenementToEdit = null;
      
      if (filteredEvenements.length > 0) {
        evenementToEdit = filteredEvenements[0];
      } else {
        evenementToEdit = evenements[0];
      }
      
      if (evenementToEdit) {
        const evenementId = evenementToEdit.evenement.value.split('#')[1];
        
        // Préparer les données de mise à jour
        const updateData = {
          psDateDebut: aiResult.data?.psDateDebut || evenementToEdit.psDateDebut?.value,
          psDateFin: aiResult.data?.psDateFin || evenementToEdit.psDateFin?.value,
          psStatus: aiResult.data?.psStatus || evenementToEdit.psStatus?.value,
          psDescription: aiResult.data?.psDescription || evenementToEdit.psDescription?.value,
          aTitle: aiResult.data?.aTitle || evenementToEdit.aTitle?.value,
          aLocalisation: aiResult.data?.aLocalisation || evenementToEdit.aLocalisation?.value
        };
        
        console.log("📝 Édition automatique des données:", updateData);
        
        // Exécuter la mise à jour
        const response = await fetch(`http://localhost:5000/api/evenements/${evenementId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          showAlert(`✅ Événement modifié automatiquement!`, "success");
          fetchEvenements();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la modification automatique');
        }
      } else {
        showAlert("❌ Aucun événement trouvé pour modification automatique", "warning");
      }
    } catch (error) {
      showAlert("❌ Erreur édition automatique: " + error.message, "danger");
    }
  };

  // Fonction de suppression directe
  const handleDeleteDirect = async (evenementUri) => {
    try {
      const evenementId = evenementUri.split('#')[1];
      const response = await fetch(`http://localhost:5000/api/evenements/${evenementId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchEvenements();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // Fonction pour exécuter la suppression automatique
  const executeAIDelete = async (aiResult) => {
    if (filteredEvenements.length === 0) {
      showAlert("❌ Aucun événement à supprimer trouvé", "warning");
      return;
    }

    try {
      let deletedCount = 0;
      
      if (aiResult.filters && aiResult.filters.length > 0) {
        for (const evenement of filteredEvenements) {
          await handleDeleteDirect(evenement.evenement.value);
          deletedCount++;
        }
        showAlert(`✅ ${deletedCount} événement(s) supprimé(s) automatiquement!`, "success");
      } else {
        const evenementToDelete = filteredEvenements[0];
        await handleDeleteDirect(evenementToDelete.evenement.value);
        showAlert("✅ Événement supprimé automatiquement!", "success");
      }
    } catch (error) {
      showAlert("❌ Erreur suppression automatique: " + error.message, "danger");
    }
  };

  // Fonction pour traiter les questions AI
  const processAIQuestion = async (question) => {
    if (!question.trim()) return;
    
    setIsAiLoading(true);
    try {
      const response = await fetch('http://localhost:8000/ai/process-evenements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const aiResult = await response.json();
      setAiResponse(aiResult);
      
      console.log("🤖 Résultat AI reçu:", aiResult);

      // CRÉATION - EXÉCUTION AUTOMATIQUE
      if (aiResult.action === 'create' && aiResult.data) {
        showAlert("🤖 " + aiResult.natural_response, "success");
        setTimeout(() => {
          executeAICreate(aiResult);
        }, 1000);
      } 
      // RECHERCHE AVEC FILTRES - AUTOMATIQUE
      else if (aiResult.action === 'read') {
        console.log("🔍 Données AI reçues pour recherche:", aiResult);
        if (aiResult.filters && aiResult.filters.length > 0) {
          applyAIFilters(aiResult.filters);
          showAlert("🎯 " + aiResult.natural_response, "success");
        } else {
          showAlert(aiResult.natural_response, "info");
        }
      }
      // SUPPRESSION - EXÉCUTION AUTOMATIQUE
      else if (aiResult.action === 'delete') {
        showAlert("🗑️ " + aiResult.natural_response, "warning");
        setTimeout(() => {
          executeAIDelete(aiResult);
        }, 1000);
      }
      // ÉDITION - EXÉCUTION AUTOMATIQUE
      else if (aiResult.action === 'update') {
        showAlert("✏️ " + aiResult.natural_response, "success");
        setTimeout(() => {
          executeAIUpdate(aiResult, question);
        }, 1000);
      }
      else {
        showAlert(aiResult.natural_response, "info");
      }
      
    } catch (error) {
      showAlert("Erreur AI: " + error.message, "danger");
    } finally {
      setIsAiLoading(false);
      setAiInput("");
    }
  };

  const filterEvenements = () => {
    let filtered = evenements.filter(evenement => {
      const psDateDebut = evenement.psDateDebut?.value || '';
      const psDateFin = evenement.psDateFin?.value || '';
      const psStatus = evenement.psStatus?.value || '';
      const psDescription = evenement.psDescription?.value || '';
      const aTitle = evenement.aTitle?.value || '';
      const aLocalisation = evenement.aLocalisation?.value || '';
      const id = evenement.evenement?.value.split('#')[1] || '';

      const searchLower = searchTerm.toLowerCase();
      
      const searchMatch = (
        psDateDebut.toString().toLowerCase().includes(searchLower) ||
        psDateFin.toString().toLowerCase().includes(searchLower) ||
        psStatus.toString().toLowerCase().includes(searchLower) ||
        psDescription.toString().toLowerCase().includes(searchLower) ||
        aTitle.toString().toLowerCase().includes(searchLower) ||
        aLocalisation.toString().toLowerCase().includes(searchLower) ||
        id.toLowerCase().includes(searchLower)
      );

      // Filtre par critères AI
      const aiFilterMatch = activeFilters.length === 0 ? true : 
        activeFilters.every(filter => {
          let value;
          if (filter.field === 'psDateDebut') {
            value = evenement.psDateDebut?.value;
          } else if (filter.field === 'psDateFin') {
            value = evenement.psDateFin?.value;
          } else if (filter.field === 'psStatus') {
            value = evenement.psStatus?.value;
          } else if (filter.field === 'aTitle') {
            value = evenement.aTitle?.value;
          } else if (filter.field === 'aLocalisation') {
            value = evenement.aLocalisation?.value;
          }
          
          if (!value) return false;
          
          switch (filter.operator) {
            case 'contains':
              return value.toLowerCase().includes(filter.value.toLowerCase());
            case '==':
              return value === filter.value;
            case '>':
              return value > filter.value;
            case '<':
              return value < filter.value;
            default:
              return true;
          }
        });

      return searchMatch && aiFilterMatch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = getSortValue(a, sortConfig.key);
        let bValue = getSortValue(b, sortConfig.key);

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredEvenements(filtered);
  };

  const getSortValue = (evenement, key) => {
    switch (key) {
      case 'psDateDebut':
        return evenement.psDateDebut?.value || '';
      case 'psDateFin':
        return evenement.psDateFin?.value || '';
      case 'psStatus':
        return evenement.psStatus?.value || '';
      case 'aTitle':
        return evenement.aTitle?.value || '';
      case 'aLocalisation':
        return evenement.aLocalisation?.value || '';
      case 'id':
        return evenement.evenement?.value.split('#')[1] || '';
      default:
        return '';
    }
  };

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  const isColumnSorted = (key) => {
    return sortConfig.key === key;
  };

  const showAlert = (message, color) => {
    setAlert({ visible: true, message, color });
    setTimeout(() => setAlert({ ...alert, visible: false }), 5000);
  };

  const onDismiss = () => setAlert({ ...alert, visible: false });

  // Réinitialiser les filtres AI
  const resetAIFilters = () => {
    setActiveFilters([]);
    setAiResponse(null);
    showAlert("Filtres AI réinitialisés", "info");
  };

  // Ouvrir modal d'ajout
  const openAddModal = () => {
    setFormData({ 
      psDateDebut: "", 
      psDateFin: "", 
      psStatus: "", 
      psDescription: "", 
      aTitle: "", 
      aLocalisation: "" 
    });
    setAiResponse(null);
    setAddModal(true);
  };

  // CREATE (manuel)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/evenements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          psDateDebut: formData.psDateDebut,
          psDateFin: formData.psDateFin,
          psStatus: formData.psStatus,
          psDescription: formData.psDescription,
          aTitle: formData.aTitle,
          aLocalisation: formData.aLocalisation
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'insertion');
      }

      const result = await response.json();
      showAlert(result.message || "Événement ajouté avec succès!", "success");
      setFormData({ 
        psDateDebut: "", 
        psDateFin: "", 
        psStatus: "", 
        psDescription: "", 
        aTitle: "", 
        aLocalisation: "" 
      });
      setAddModal(false);
      fetchEvenements();
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // UPDATE - Ouvrir modal d'édition (manuel)
  const openEditModal = (evenement) => {
    setEditingEvenement(evenement);
    setFormData({
      psDateDebut: evenement.psDateDebut?.value || "",
      psDateFin: evenement.psDateFin?.value || "",
      psStatus: evenement.psStatus?.value || "",
      psDescription: evenement.psDescription?.value || "",
      aTitle: evenement.aTitle?.value || "",
      aLocalisation: evenement.aLocalisation?.value || ""
    });
    setEditModal(true);
  };

  // UPDATE - Sauvegarder (manuel)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const evenementId = editingEvenement.evenement.value.split('#')[1];
      const response = await fetch(`http://localhost:5000/api/evenements/${evenementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          psDateDebut: formData.psDateDebut,
          psDateFin: formData.psDateFin,
          psStatus: formData.psStatus,
          psDescription: formData.psDescription,
          aTitle: formData.aTitle,
          aLocalisation: formData.aLocalisation
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification');
      }

      const result = await response.json();
      showAlert(result.message || "Événement modifié avec succès!", "success");
      setEditModal(false);
      setEditingEvenement(null);
      setFormData({ 
        psDateDebut: "", 
        psDateFin: "", 
        psStatus: "", 
        psDescription: "", 
        aTitle: "", 
        aLocalisation: "" 
      });
      fetchEvenements();
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // DELETE (manuel avec confirmation)
  const handleDelete = async (evenementUri) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      try {
        const evenementId = evenementUri.split('#')[1];
        const response = await fetch(`http://localhost:5000/api/evenements/${evenementId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        const result = await response.json();
        showAlert(result.message || "Événement supprimé avec succès!", "success");
        fetchEvenements();
      } catch (error) {
        showAlert("Erreur: " + error.message, "danger");
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'planifié':
      case 'planifie':
        return "info";
      case 'en cours':
        return "warning";
      case 'terminé':
      case 'termine':
      case 'complété':
      case 'complete':
        return "success";
      case 'annulé':
      case 'annule':
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'planifié':
      case 'planifie':
        return "📅";
      case 'en cours':
        return "🔄";
      case 'terminé':
      case 'termine':
      case 'complété':
      case 'complete':
        return "✅";
      case 'annulé':
      case 'annule':
        return "❌";
      default:
        return "📋";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        {/* ALERTE */}
        {alert.visible && (
          <Alert color={alert.color} toggle={onDismiss} className="mx-3">
            {alert.message}
          </Alert>
        )}

        <Row>
          <Col>
            {/* CARTE ASSISTANT AI */}
            <Card className="bg-gradient-success text-white mb-4">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="text-white mb-0">🤖 Assistant IA - Événements</h5>
                  </Col>
                  <Col className="text-right">
                    <Badge color="light" className="text-success">
                      BETA
                    </Badge>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <Row className="align-items-center">
                  <Col lg="8">
                    <p className="text-light mb-2">
                      <strong>Exemples :</strong> "Ajoute événement conférence Paris", "Affiche événements planifiés", "Supprime un événement"
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {["Ajoute événement Réunion Tokyo", "Affiche événements terminés", "Événement annulé", "Supprime un événement"].map((example, idx) => (
                        <Badge 
                          key={idx}
                          color="light" 
                          className="cursor-pointer text-success"
                          onClick={() => processAIQuestion(example)}
                          style={{ cursor: 'pointer' }}
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </Col>
                  <Col lg="4">
                    <InputGroup>
                      <Input 
                        placeholder="Posez votre question..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && processAIQuestion(aiInput)}
                        disabled={isAiLoading}
                      />
                      <Button 
                        color="white" 
                        disabled={isAiLoading || !aiInput.trim()}
                        onClick={() => processAIQuestion(aiInput)}
                      >
                        {isAiLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm mr-2" />
                            Analyse...
                          </>
                        ) : (
                          "➡️ Envoyer"
                        )}
                      </Button>
                    </InputGroup>
                  </Col>
                </Row>

                {/* Affichage des filtres actifs */}
                {activeFilters.length > 0 && (
                  <div className="mt-3 p-2 bg-warning text-dark rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>🎯 Filtres AI actifs:</strong>
                        {activeFilters.map((filter, idx) => (
                          <Badge key={idx} color="dark" className="ml-2">
                            {filter.description || `${filter.field} ${filter.operator} ${filter.value}`}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm" color="dark" onClick={resetAIFilters}>
                        × Réinitialiser
                      </Button>
                    </div>
                  </div>
                )}

                {/* Affichage de la réponse AI */}
                {aiResponse && (
                  <div className="mt-3 p-3 bg-white rounded text-dark">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <strong>🤖 Réponse:</strong>
                      <Button 
                        size="sm" 
                        color="outline-dark"
                        onClick={() => setAiResponse(null)}
                      >
                        ×
                      </Button>
                    </div>
                    <p className="mb-2">{aiResponse.natural_response}</p>
                    
                    {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">
                          <strong>Suggestions:</strong> {aiResponse.suggestions.join(" • ")}
                        </small>
                      </div>
                    )}
                    
                    {aiResponse.data && Object.keys(aiResponse.data).length > 0 && (
                      <div className="mt-2">
                        <small className="text-success">
                          <strong>Données détectées:</strong> {JSON.stringify(aiResponse.data)}
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* CARTE PRINCIPALE DES ÉVÉNEMENTS */}
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <Col>
                    <h3 className="mb-0">📅 Gestion des Événements</h3>
                    {activeFilters.length > 0 && (
                      <small className="text-muted">
                        Affichage filtré par AI ({filteredEvenements.length} résultat(s))
                      </small>
                    )}
                  </Col>
                  <Col className="text-right">
                    <Button 
                      color="primary" 
                      onClick={openAddModal}
                      className="mr-2"
                    >
                      ➕ Ajouter un Événement
                    </Button>
                    <Button 
                      color="info" 
                      size="sm" 
                      onClick={fetchEvenements}
                      className="mr-2"
                    >
                      🔄 Actualiser
                    </Button>
                    {activeFilters.length > 0 && (
                      <Button 
                        color="warning" 
                        size="sm" 
                        onClick={resetAIFilters}
                      >
                        🗑️ Effacer filtres
                      </Button>
                    )}
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {/* BARRE DE RECHERCHE ET FILTRES */}
                <Row className="mb-4">
                  <Col lg="6">
                    <InputGroup>
                      <InputGroupText>🔍</InputGroupText>
                      <Input
                        placeholder="Rechercher par titre, localisation, statut..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col lg="6" className="text-right">
                    <div className="d-flex align-items-center justify-content-end">
                      <Badge color="primary" className="p-2 mr-3">
                        {filteredEvenements.length} / {evenements.length} résultats
                        {activeFilters.length > 0 && " (filtré)"}
                      </Badge>
                      
                      <ButtonGroup size="sm">
                        <Button 
                          color={sortConfig.direction === 'asc' ? 'primary' : 'secondary'}
                          onClick={() => handleSort(sortConfig.key || 'id', 'asc')}
                          disabled={!sortConfig.key}
                        >
                          ↑ ASC
                        </Button>
                        <Button 
                          color={sortConfig.direction === 'desc' ? 'primary' : 'secondary'}
                          onClick={() => handleSort(sortConfig.key || 'id', 'desc')}
                          disabled={!sortConfig.key}
                        >
                          ↓ DESC
                        </Button>
                      </ButtonGroup>
                    </div>
                  </Col>
                </Row>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Chargement...</span>
                    </div>
                    <p className="mt-2">Chargement des événements...</p>
                  </div>
                ) : (
                  <Table responsive striped className="align-items-center">
                    <thead className="thead-light">
                      <tr>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>ID</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('id') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('id', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('id') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('id', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📝 Titre</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('aTitle') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aTitle', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('aTitle') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aTitle', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📍 Localisation</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('aLocalisation') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aLocalisation', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('aLocalisation') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aLocalisation', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📅 Date Début</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('psDateDebut') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('psDateDebut', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('psDateDebut') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('psDateDebut', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📅 Date Fin</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('psDateFin') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('psDateFin', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('psDateFin') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('psDateFin', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📊 Statut</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('psStatus') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('psStatus', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('psStatus') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('psStatus', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0 text-center">⚙️ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvenements.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="text-muted">
                              <i className="ni ni-calendar-grid-58 ni-3x mb-3"></i>
                              <br />
                              {evenements.length === 0 ? 'Aucun événement trouvé' : 'Aucun résultat pour votre recherche'}
                              {activeFilters.length > 0 && (
                                <div className="mt-2">
                                  <Button 
                                    color="warning" 
                                    size="sm"
                                    onClick={resetAIFilters}
                                  >
                                    🗑️ Effacer les filtres AI
                                  </Button>
                                </div>
                              )}
                              <br />
                              <Button 
                                color="primary" 
                                size="sm" 
                                className="mt-2"
                                onClick={openAddModal}
                              >
                                ➕ Ajouter le premier événement
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredEvenements.map((evenement, index) => {
                          return (
                            <tr key={index}>
                              <td className="border-0">
                                <Badge color="info" className="text-uppercase">
                                  {evenement.evenement?.value.split('#')[1] || 'N/A'}
                                </Badge>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">📝</span>
                                  <div>
                                    <strong>{evenement.aTitle?.value || 'N/A'}</strong>
                                    {evenement.psDescription?.value && (
                                      <div>
                                        <br />
                                        <small className="text-muted">
                                          {evenement.psDescription.value.length > 50 
                                            ? evenement.psDescription.value.substring(0, 50) + '...'
                                            : evenement.psDescription.value
                                          }
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">📍</span>
                                  <div>
                                    {evenement.aLocalisation?.value || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">📅</span>
                                  <div>
                                    {formatDate(evenement.psDateDebut?.value)}
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">📅</span>
                                  <div>
                                    {formatDate(evenement.psDateFin?.value)}
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">{getStatusIcon(evenement.psStatus?.value)}</span>
                                  <div>
                                    <Badge color={getStatusColor(evenement.psStatus?.value)} className="mr-2">
                                      {evenement.psStatus?.value || 'N/A'}
                                    </Badge>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0 text-center">
                                <Button 
                                  color="warning" 
                                  size="sm" 
                                  className="mr-1"
                                  onClick={() => openEditModal(evenement)}
                                  title="Modifier"
                                >
                                  <i className="ni ni-ruler-pencil"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm"
                                  onClick={() => handleDelete(evenement.evenement.value)}
                                  title="Supprimer"
                                >
                                  <i className="ni ni-fat-remove"></i>
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* MODAL D'AJOUT (manuel) */}
        <Modal isOpen={addModal} toggle={() => setAddModal(!addModal)} size="lg">
          <ModalHeader toggle={() => setAddModal(!addModal)}>
            <i className="ni ni-fat-add mr-2"></i>
            Ajouter un Nouvel Événement
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="aTitle">
                      <i className="ni ni-single-copy-04 mr-1"></i>
                      Titre de l'événement *
                    </Label>
                    <Input
                      type="text"
                      name="aTitle"
                      id="aTitle"
                      placeholder="Ex: Conférence annuelle"
                      value={formData.aTitle}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="aLocalisation">
                      <i className="ni ni-pin-3 mr-1"></i>
                      Localisation *
                    </Label>
                    <Input
                      type="text"
                      name="aLocalisation"
                      id="aLocalisation"
                      placeholder="Ex: Paris, France"
                      value={formData.aLocalisation}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="psDateDebut">
                      <i className="ni ni-calendar-grid-58 mr-1"></i>
                      Date de début *
                    </Label>
                    <Input
                      type="date"
                      name="psDateDebut"
                      id="psDateDebut"
                      value={formData.psDateDebut}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="psDateFin">
                      <i className="ni ni-calendar-grid-58 mr-1"></i>
                      Date de fin *
                    </Label>
                    <Input
                      type="date"
                      name="psDateFin"
                      id="psDateFin"
                      value={formData.psDateFin}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="psStatus">
                      <i className="ni ni-badge mr-1"></i>
                      Statut *
                    </Label>
                    <Input
                      type="select"
                      name="psStatus"
                      id="psStatus"
                      value={formData.psStatus}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionnez un statut</option>
                      <option value="Planifié">Planifié</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                      <option value="Annulé">Annulé</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="psDescription">
                      <i className="ni ni-align-left-2 mr-1"></i>
                      Description
                    </Label>
                    <Input
                      type="textarea"
                      name="psDescription"
                      id="psDescription"
                      placeholder="Description de l'événement..."
                      value={formData.psDescription}
                      onChange={handleChange}
                      rows="3"
                    />
                  </FormGroup>
                </Col>
              </Row>
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-primary mb-2">
                  <i className="ni ni-notification-70 mr-1"></i>
                  Guide des statuts :
                </h6>
                <div className="d-flex flex-wrap gap-3 text-sm">
                  <span><Badge color="info">Planifié</Badge> Événement à venir</span>
                  <span><Badge color="warning">En cours</Badge> Événement en cours</span>
                  <span><Badge color="success">Terminé</Badge> Événement complété</span>
                  <span><Badge color="danger">Annulé</Badge> Événement annulé</span>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setAddModal(false)}>
                <i className="ni ni-fat-remove mr-1"></i>
                Annuler
              </Button>
              <Button color="primary" type="submit">
                <i className="ni ni-check-bold mr-1"></i>
                Ajouter l'Événement
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* MODAL D'ÉDITION (manuel) */}
        <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)} size="lg">
          <ModalHeader toggle={() => setEditModal(!editModal)}>
            <i className="ni ni-ruler-pencil mr-2"></i>
            Modifier l'Événement
          </ModalHeader>
          <Form onSubmit={handleUpdate}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-aTitle">Titre de l'événement</Label>
                    <Input
                      type="text"
                      name="aTitle"
                      id="edit-aTitle"
                      value={formData.aTitle}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-aLocalisation">Localisation</Label>
                    <Input
                      type="text"
                      name="aLocalisation"
                      id="edit-aLocalisation"
                      value={formData.aLocalisation}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-psDateDebut">Date de début</Label>
                    <Input
                      type="date"
                      name="psDateDebut"
                      id="edit-psDateDebut"
                      value={formData.psDateDebut}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-psDateFin">Date de fin</Label>
                    <Input
                      type="date"
                      name="psDateFin"
                      id="edit-psDateFin"
                      value={formData.psDateFin}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-psStatus">Statut</Label>
                    <Input
                      type="select"
                      name="psStatus"
                      id="edit-psStatus"
                      value={formData.psStatus}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionnez un statut</option>
                      <option value="Planifié">Planifié</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                      <option value="Annulé">Annulé</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-psDescription">Description</Label>
                    <Input
                      type="textarea"
                      name="psDescription"
                      id="edit-psDescription"
                      value={formData.psDescription}
                      onChange={handleChange}
                      rows="3"
                    />
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setEditModal(false)}>
                Annuler
              </Button>
              <Button color="primary" type="submit">
                Sauvegarder
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

export default EvenementForm;