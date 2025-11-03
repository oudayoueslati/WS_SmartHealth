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

const MesureForm = () => {
  const [formData, setFormData] = useState({
    valeurIMC: "",
    caloriesConsommees: "",
    mesureValue: ""
  });
  const [alert, setAlert] = useState({ visible: false, message: "", color: "" });
  const [mesures, setMesures] = useState([]);
  const [filteredMesures, setFilteredMesures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editingMesure, setEditingMesure] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // États pour l'AI
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    fetchMesures();
  }, []);

  useEffect(() => {
    filterMesures();
  }, [searchTerm, mesures, sortConfig, activeFilters]);

  const fetchMesures = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/mesures');
      const result = await response.json();
      setMesures(result.results.bindings);
    } catch (error) {
      showAlert("Erreur lors du chargement des mesures", "danger");
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
    
    // Afficher un message avec les filtres appliqués
    const filterDescriptions = filters.map(f => 
      f.description || `${f.field} ${f.operator} ${f.value}`
    );
    showAlert(`🎯 Filtres AI appliqués: ${filterDescriptions.join(', ')}`, "success");
  };

  // Fonction pour exécuter la création automatique
  const executeAICreate = async (aiResult) => {
    try {
      const response = await fetch('http://localhost:5000/api/mesures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valeurIMC: aiResult.data.valeurIMC || "",
          caloriesConsommees: aiResult.data.caloriesConsommees || "",
          mesureValue: aiResult.data.mesureValue || ""
        })
      });

      if (response.ok) {
        showAlert("✅ Mesure créée automatiquement avec succès!", "success");
        fetchMesures(); // Actualiser les données
      } else {
        throw new Error('Erreur lors de la création automatique');
      }
    } catch (error) {
      showAlert("❌ Erreur création automatique: " + error.message, "danger");
    }
  };

  // Fonction pour exécuter l'édition automatique
  const executeAIUpdate = async (aiResult, originalQuestion) => {
    try {
      // Extraire les nombres de la question originale
      const numbers = originalQuestion.match(/\d+\.?\d*/g);
      console.log("🔢 Nombres détectés pour édition:", numbers);
      
      let oldValue, newValue;
      
      if (numbers && numbers.length >= 2) {
        oldValue = parseFloat(numbers[0]);
        newValue = parseFloat(numbers[1]);
        console.log(`🔄 Édition automatique: ${oldValue} → ${newValue}`);
      }
      
      // Trouver la mesure à modifier
      let mesureToEdit = null;
      
      if (oldValue) {
        // Rechercher par ancienne valeur d'IMC
        mesureToEdit = mesures.find(m => {
          const imcValue = parseFloat(m.imc?.value);
          return imcValue === oldValue;
        });
      }
      
      // Fallback: première mesure filtrée ou première mesure
      if (!mesureToEdit) {
        mesureToEdit = filteredMesures.length > 0 ? filteredMesures[0] : mesures[0];
      }
      
      if (mesureToEdit) {
        const mesureId = mesureToEdit.mesure.value.split('#')[1];
        
        // Préparer les données de mise à jour
        const updateData = {
          valeurIMC: newValue ? newValue.toString() : (aiResult.data?.valeurIMC || mesureToEdit.imc?.value),
          caloriesConsommees: mesureToEdit.calories?.value || "",
          mesureValue: mesureToEdit.mesureValue?.value || ""
        };
        
        console.log("📝 Édition automatique des données:", updateData);
        
        // Exécuter la mise à jour
        const response = await fetch(`http://localhost:5000/api/mesures/${mesureId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          showAlert(`✅ Mesure modifiée automatiquement! Nouvel IMC: ${updateData.valeurIMC}`, "success");
          fetchMesures(); // Actualiser les données
        } else {
          throw new Error('Erreur lors de la modification automatique');
        }
      } else {
        showAlert("❌ Aucune mesure trouvée pour modification automatique", "warning");
      }
    } catch (error) {
      showAlert("❌ Erreur édition automatique: " + error.message, "danger");
    }
  };

  // Fonction de suppression directe (sans confirmation supplémentaire)
  const handleDeleteDirect = async (mesureUri) => {
    try {
      const mesureId = mesureUri.split('#')[1];
      const response = await fetch(`http://localhost:5000/api/mesures/${mesureId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchMesures(); // Actualiser les données
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // Fonction pour exécuter la suppression automatique
  const executeAIDelete = async (aiResult) => {
    if (filteredMesures.length === 0) {
      showAlert("❌ Aucune mesure à supprimer trouvée", "warning");
      return;
    }

    try {
      let deletedCount = 0;
      
      // Si des filtres sont détectés, supprimer toutes les mesures filtrées
      if (aiResult.filters && aiResult.filters.length > 0) {
        for (const mesure of filteredMesures) {
          await handleDeleteDirect(mesure.mesure.value);
          deletedCount++;
        }
        showAlert(`✅ ${deletedCount} mesure(s) supprimée(s) automatiquement!`, "success");
      } else {
        // Supprimer la première mesure du tableau
        const mesureToDelete = filteredMesures[0];
        await handleDeleteDirect(mesureToDelete.mesure.value);
        showAlert("✅ Mesure supprimée automatiquement!", "success");
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
      const response = await fetch('http://localhost:8000/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question
        })
      });

      const aiResult = await response.json();
      setAiResponse(aiResult);
      
      console.log("🤖 Résultat AI reçu:", aiResult);

      // SI C'EST UNE CRÉATION - EXÉCUTION AUTOMATIQUE
      if (aiResult.action === 'create' && aiResult.data) {
        showAlert("🤖 " + aiResult.natural_response, "success");
        // Exécuter automatiquement la création
        setTimeout(() => {
          executeAICreate(aiResult);
        }, 1000);
      } 
      // SI C'EST UNE RECHERCHE AVEC FILTRES - AUTOMATIQUE
      else if (aiResult.action === 'read') {
        console.log("🔍 Données AI reçues pour recherche:", aiResult);
        if (aiResult.filters && aiResult.filters.length > 0) {
          applyAIFilters(aiResult.filters);
          showAlert("🎯 " + aiResult.natural_response, "success");
        } else {
          showAlert(aiResult.natural_response, "info");
        }
      }
      // SI C'EST UNE SUPPRESSION - EXÉCUTION AUTOMATIQUE
      else if (aiResult.action === 'delete') {
        showAlert("🗑️ " + aiResult.natural_response, "warning");
        // Lancer la suppression après un court délai pour que l'alerte soit visible
        setTimeout(() => {
          executeAIDelete(aiResult);
        }, 1000);
      }
      // SI C'EST UNE ÉDITION - EXÉCUTION AUTOMATIQUE
      else if (aiResult.action === 'update') {
        showAlert("✏️ " + aiResult.natural_response, "success");
        // Lancer l'édition après un court délai
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

  const filterMesures = () => {
    let filtered = mesures.filter(mesure => {
      const imc = mesure.imc?.value || '';
      const calories = mesure.calories?.value || '';
      const mesureValue = mesure.mesureValue?.value || '';
      const id = mesure.mesure.value.split('#')[1] || '';

      const searchLower = searchTerm.toLowerCase();
      
      // Filtre par recherche textuelle
      const searchMatch = (
        imc.toString().includes(searchLower) ||
        calories.toString().includes(searchLower) ||
        mesureValue.toString().includes(searchLower) ||
        id.toLowerCase().includes(searchLower)
      );

      // Filtre par critères AI
      const aiFilterMatch = activeFilters.length === 0 ? true : 
        activeFilters.every(filter => {
          let value;
          if (filter.field === 'imc') {
            value = parseFloat(mesure.imc?.value);
          } else if (filter.field === 'calories') {
            value = parseFloat(mesure.calories?.value);
          } else if (filter.field === 'mesurevalue') {
            value = parseFloat(mesure.mesureValue?.value);
          }
          
          if (isNaN(value)) return false;
          
          switch (filter.operator) {
            case '>':
              return value > parseFloat(filter.value);
            case '<':
              return value < parseFloat(filter.value);
            case '>=':
              return value >= parseFloat(filter.value);
            case '<=':
              return value <= parseFloat(filter.value);
            default:
              return true;
          }
        });

      return searchMatch && aiFilterMatch;
    });

    // Appliquer le tri après le filtrage
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

    setFilteredMesures(filtered);
  };

  const getSortValue = (mesure, key) => {
    switch (key) {
      case 'imc':
        return parseFloat(mesure.imc?.value) || 0;
      case 'calories':
        return parseInt(mesure.calories?.value) || 0;
      case 'mesureValue':
        return parseInt(mesure.mesureValue?.value) || 0;
      case 'id':
        return mesure.mesure.value.split('#')[1];
      default:
        return '';
    }
  };

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
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
    setFormData({ valeurIMC: "", caloriesConsommees: "", mesureValue: "" });
    setAiResponse(null);
    setAddModal(true);
  };

  // CREATE (manuel)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/mesures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valeurIMC: formData.valeurIMC,
          caloriesConsommees: formData.caloriesConsommees,
          mesureValue: formData.mesureValue
        })
      });

      if (response.ok) {
        showAlert("Mesure ajoutée avec succès!", "success");
        setFormData({ valeurIMC: "", caloriesConsommees: "", mesureValue: "" });
        setAddModal(false);
        setAiResponse(null);
        fetchMesures();
      } else {
        throw new Error('Erreur lors de l\'insertion');
      }
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // UPDATE - Ouvrir modal d'édition (manuel)
  const openEditModal = (mesure) => {
    setEditingMesure(mesure);
    setFormData({
      valeurIMC: mesure.imc?.value || "",
      caloriesConsommees: mesure.calories?.value || "",
      mesureValue: mesure.mesureValue?.value || ""
    });
    setEditModal(true);
  };

  // UPDATE - Sauvegarder (manuel)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const mesureId = editingMesure.mesure.value.split('#')[1];
      const response = await fetch(`http://localhost:5000/api/mesures/${mesureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valeurIMC: formData.valeurIMC,
          caloriesConsommees: formData.caloriesConsommees,
          mesureValue: formData.mesureValue
        })
      });

      if (response.ok) {
        showAlert("Mesure modifiée avec succès!", "success");
        setEditModal(false);
        setEditingMesure(null);
        setFormData({ valeurIMC: "", caloriesConsommees: "", mesureValue: "" });
        fetchMesures();
      } else {
        throw new Error('Erreur lors de la modification');
      }
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // DELETE (manuel avec confirmation)
  const handleDelete = async (mesureUri) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette mesure ?")) {
      try {
        const mesureId = mesureUri.split('#')[1];
        const response = await fetch(`http://localhost:5000/api/mesures/${mesureId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showAlert("Mesure supprimée avec succès!", "success");
          fetchMesures();
        } else {
          throw new Error('Erreur lors de la suppression');
        }
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

  const getIMCCategory = (imc) => {
    if (!imc) return { label: "Non défini", color: "secondary" };
    const imcValue = parseFloat(imc);
    if (imcValue < 18.5) return { label: "Maigreur", color: "warning" };
    if (imcValue < 25) return { label: "Normal", color: "success" };
    if (imcValue < 30) return { label: "Surpoids", color: "warning" };
    return { label: "Obésité", color: "danger" };
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
            <Card className="bg-gradient-info text-white mb-4">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="text-white mb-0">🤖 Assistant IA Intelligent</h5>
                  </Col>
                  <Col className="text-right">
                    <Badge color="light" className="text-info">
                      BETA
                    </Badge>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <Row className="align-items-center">
                  <Col lg="8">
                    <p className="text-light mb-2">
                      <strong>Exemples :</strong> "Ajoute IMC 24", "Affiche les IMC élevés", "Supprime une mesure"
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {["Ajoute IMC 22", "Affiche IMC élevés", "Calories > 2000", "Supprime une mesure"].map((example, idx) => (
                        <Badge 
                          key={idx}
                          color="light" 
                          className="cursor-pointer text-info"
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

            {/* CARTE PRINCIPALE DES MESURES */}
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <Col>
                    <h3 className="mb-0">📊 Gestion des Mesures</h3>
                    {activeFilters.length > 0 && (
                      <small className="text-muted">
                        Affichage filtré par AI ({filteredMesures.length} résultat(s))
                      </small>
                    )}
                  </Col>
                  <Col className="text-right">
                    <Button 
                      color="primary" 
                      onClick={openAddModal}
                      className="mr-2"
                    >
                      ➕ Ajouter une Mesure
                    </Button>
                    <Button 
                      color="info" 
                      size="sm" 
                      onClick={fetchMesures}
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
                        placeholder="Rechercher par IMC, calories, mesure ou ID..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col lg="6" className="text-right">
                    <div className="d-flex align-items-center justify-content-end">
                      <Badge color="primary" className="p-2 mr-3">
                        {filteredMesures.length} / {mesures.length} résultats
                        {activeFilters.length > 0 && " (filtré)"}
                      </Badge>
                      
                      {/* BOUTONS DE TRI GLOBAUX */}
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
                    <p className="mt-2">Chargement des mesures...</p>
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
                            <span>📏 IMC</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('imc') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('imc', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('imc') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('imc', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>🔥 Calories</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('calories') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('calories', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('calories') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('calories', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📈 Mesure</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('mesureValue') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('mesureValue', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('mesureValue') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('mesureValue', 'desc')}
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
                      {filteredMesures.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <div className="text-muted">
                              <i className="ni ni-archive-2 ni-3x mb-3"></i>
                              <br />
                              {mesures.length === 0 ? 'Aucune mesure trouvée' : 'Aucun résultat pour votre recherche'}
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
                                ➕ Ajouter la première mesure
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredMesures.map((mesure, index) => {
                          const imcCategory = getIMCCategory(mesure.imc?.value);
                          return (
                            <tr key={index}>
                              <td className="border-0">
                                <Badge color="info" className="text-uppercase">
                                  {mesure.mesure.value.split('#')[1]}
                                </Badge>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <Badge color={imcCategory.color} className="mr-2">
                                    {mesure.imc?.value || 'N/A'}
                                  </Badge>
                                  <small className="text-muted">
                                    {imcCategory.label}
                                  </small>
                                </div>
                              </td>
                              <td className="border-0">
                                <span className="font-weight-bold">
                                  {mesure.calories?.value || 'N/A'}
                                </span>
                                <br />
                                <small className="text-muted">calories</small>
                              </td>
                              <td className="border-0">
                                <span className="font-weight-bold">
                                  {mesure.mesureValue?.value || 'N/A'}
                                </span>
                                <br />
                                <small className="text-muted">unités</small>
                              </td>
                              <td className="border-0 text-center">
                                <Button 
                                  color="warning" 
                                  size="sm" 
                                  className="mr-1"
                                  onClick={() => openEditModal(mesure)}
                                  title="Modifier"
                                >
                                  <i className="ni ni-ruler-pencil"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm"
                                  onClick={() => handleDelete(mesure.mesure.value)}
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
            Ajouter une Nouvelle Mesure
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="valeurIMC">
                      <i className="ni ni-chart-bar-32 mr-1"></i>
                      IMC
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      name="valeurIMC"
                      id="valeurIMC"
                      placeholder="Ex: 24.5"
                      value={formData.valeurIMC}
                      onChange={handleChange}
                      required
                    />
                    <small className="form-text text-muted">
                      Indice de Masse Corporelle
                    </small>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="caloriesConsommees">
                      <i className="ni ni-single-copy-04 mr-1"></i>
                      Calories Consommées
                    </Label>
                    <Input
                      type="number"
                      name="caloriesConsommees"
                      id="caloriesConsommees"
                      placeholder="Ex: 2000"
                      value={formData.caloriesConsommees}
                      onChange={handleChange}
                      required
                    />
                    <small className="form-text text-muted">
                      Nombre de calories quotidiennes
                    </small>
                  </FormGroup>
                </Col>
              </Row>
              <FormGroup>
                <Label for="mesureValue">
                  <i className="ni ni-ruler-pencil mr-1"></i>
                  Mesure (Pas ou autre)
                </Label>
                <Input
                  type="number"
                  name="mesureValue"
                  id="mesureValue"
                  placeholder="Ex: 75"
                  value={formData.mesureValue}
                  onChange={handleChange}
                  required
                />
                <small className="form-text text-muted">
                  Nombre de pas ou autre mesure d'activité
                </small>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setAddModal(false)}>
                <i className="ni ni-fat-remove mr-1"></i>
                Annuler
              </Button>
              <Button color="primary" type="submit">
                <i className="ni ni-check-bold mr-1"></i>
                Ajouter la Mesure
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* MODAL D'ÉDITION (manuel) */}
        <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)} size="lg">
          <ModalHeader toggle={() => setEditModal(!editModal)}>
            <i className="ni ni-ruler-pencil mr-2"></i>
            Modifier la Mesure
          </ModalHeader>
          <Form onSubmit={handleUpdate}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-valeurIMC">IMC</Label>
                    <Input
                      type="number"
                      step="0.1"
                      name="valeurIMC"
                      id="edit-valeurIMC"
                      value={formData.valeurIMC}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-caloriesConsommees">Calories Consommées</Label>
                    <Input
                      type="number"
                      name="caloriesConsommees"
                      id="edit-caloriesConsommees"
                      value={formData.caloriesConsommees}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <FormGroup>
                <Label for="edit-mesureValue">Mesure</Label>
                <Input
                  type="number"
                  name="mesureValue"
                  id="edit-mesureValue"
                  value={formData.mesureValue}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
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

export default MesureForm;