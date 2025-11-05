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

const ScoreSanteForm = () => {
  const [formData, setFormData] = useState({
    scoreActivite: "",
    scoreGlobale: "",
    scoreNutrition: "",
    scoreSommeil: ""
  });
  const [alert, setAlert] = useState({ visible: false, message: "", color: "" });
  const [scores, setScores] = useState([]);
  const [filteredScores, setFilteredScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // États pour l'AI
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    fetchScores();
  }, []);

  useEffect(() => {
    filterScores();
  }, [searchTerm, scores, sortConfig, activeFilters]);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/scores-sante');
      const result = await response.json();
      setScores(result.results.bindings);
    } catch (error) {
      showAlert("Erreur lors du chargement des scores", "danger");
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
      const response = await fetch('http://localhost:5000/api/scores-sante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoreActivite: aiResult.data.scoreActivite || "",
          scoreGlobale: aiResult.data.scoreGlobale || "",
          scoreNutrition: aiResult.data.scoreNutrition || "",
          scoreSommeil: aiResult.data.scoreSommeil || ""
        })
      });

      if (response.ok) {
        showAlert("✅ Score santé créé automatiquement avec succès!", "success");
        fetchScores();
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
      const numbers = originalQuestion.match(/\d+/g);
      console.log("🔢 Nombres détectés pour édition:", numbers);
      
      let oldValue, newValue;
      
      if (numbers && numbers.length >= 2) {
        oldValue = parseInt(numbers[0]);
        newValue = parseInt(numbers[1]);
        console.log(`🔄 Édition automatique: ${oldValue} → ${newValue}`);
      }
      
      // Trouver le score à modifier
      let scoreToEdit = null;
      
      if (oldValue) {
        // Rechercher par ancienne valeur
        scoreToEdit = scores.find(s => {
          const activiteValue = parseInt(s.activite?.value);
          const globaleValue = parseInt(s.globale?.value);
          const nutritionValue = parseInt(s.nutrition?.value);
          const sommeilValue = parseInt(s.sommeil?.value);
          
          return activiteValue === oldValue || globaleValue === oldValue || 
                 nutritionValue === oldValue || sommeilValue === oldValue;
        });
      }
      
      // Fallback: premier score filtré ou premier score
      if (!scoreToEdit) {
        scoreToEdit = filteredScores.length > 0 ? filteredScores[0] : scores[0];
      }
      
      if (scoreToEdit) {
        const scoreId = scoreToEdit.score.value.split('#')[1];
        
        // Préparer les données de mise à jour
        const updateData = {
          scoreActivite: newValue ? newValue.toString() : (aiResult.data?.scoreActivite || scoreToEdit.activite?.value),
          scoreGlobale: aiResult.data?.scoreGlobale || scoreToEdit.globale?.value,
          scoreNutrition: aiResult.data?.scoreNutrition || scoreToEdit.nutrition?.value,
          scoreSommeil: aiResult.data?.scoreSommeil || scoreToEdit.sommeil?.value
        };
        
        console.log("📝 Édition automatique des données:", updateData);
        
        // Exécuter la mise à jour
        const response = await fetch(`http://localhost:5000/api/scores-sante/${scoreId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          showAlert(`✅ Score santé modifié automatiquement!`, "success");
          fetchScores();
        } else {
          throw new Error('Erreur lors de la modification automatique');
        }
      } else {
        showAlert("❌ Aucun score trouvé pour modification automatique", "warning");
      }
    } catch (error) {
      showAlert("❌ Erreur édition automatique: " + error.message, "danger");
    }
  };

  // Fonction de suppression directe
  const handleDeleteDirect = async (scoreUri) => {
    try {
      const scoreId = scoreUri.split('#')[1];
      const response = await fetch(`http://localhost:5000/api/scores-sante/${scoreId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchScores();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // Fonction pour exécuter la suppression automatique
  const executeAIDelete = async (aiResult) => {
    if (filteredScores.length === 0) {
      showAlert("❌ Aucun score à supprimer trouvé", "warning");
      return;
    }

    try {
      let deletedCount = 0;
      
      if (aiResult.filters && aiResult.filters.length > 0) {
        for (const score of filteredScores) {
          await handleDeleteDirect(score.score.value);
          deletedCount++;
        }
        showAlert(`✅ ${deletedCount} score(s) supprimé(s) automatiquement!`, "success");
      } else {
        const scoreToDelete = filteredScores[0];
        await handleDeleteDirect(scoreToDelete.score.value);
        showAlert("✅ Score supprimé automatiquement!", "success");
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
      const response = await fetch('http://localhost:8002/ai/process-scores', {
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

  const filterScores = () => {
    let filtered = scores.filter(score => {
      const activite = score.activite?.value || '';
      const globale = score.globale?.value || '';
      const nutrition = score.nutrition?.value || '';
      const sommeil = score.sommeil?.value || '';
      const id = score.score.value.split('#')[1] || '';

      const searchLower = searchTerm.toLowerCase();
      
      const searchMatch = (
        activite.toString().includes(searchLower) ||
        globale.toString().includes(searchLower) ||
        nutrition.toString().includes(searchLower) ||
        sommeil.toString().includes(searchLower) ||
        id.toLowerCase().includes(searchLower)
      );

      // Filtre par critères AI
      const aiFilterMatch = activeFilters.length === 0 ? true : 
        activeFilters.every(filter => {
          let value;
          if (filter.field === 'activite') {
            value = parseInt(score.activite?.value);
          } else if (filter.field === 'globale') {
            value = parseInt(score.globale?.value);
          } else if (filter.field === 'nutrition') {
            value = parseInt(score.nutrition?.value);
          } else if (filter.field === 'sommeil') {
            value = parseInt(score.sommeil?.value);
          }
          
          if (isNaN(value)) return false;
          
          switch (filter.operator) {
            case '>':
              return value > parseInt(filter.value);
            case '<':
              return value < parseInt(filter.value);
            case '>=':
              return value >= parseInt(filter.value);
            case '<=':
              return value <= parseInt(filter.value);
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

    setFilteredScores(filtered);
  };

  const getSortValue = (score, key) => {
    switch (key) {
      case 'activite':
        return parseInt(score.activite?.value) || 0;
      case 'globale':
        return parseInt(score.globale?.value) || 0;
      case 'nutrition':
        return parseInt(score.nutrition?.value) || 0;
      case 'sommeil':
        return parseInt(score.sommeil?.value) || 0;
      case 'id':
        return score.score.value.split('#')[1];
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
    setFormData({ scoreActivite: "", scoreGlobale: "", scoreNutrition: "", scoreSommeil: "" });
    setAiResponse(null);
    setAddModal(true);
  };

  // CREATE (manuel)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/scores-sante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoreActivite: formData.scoreActivite,
          scoreGlobale: formData.scoreGlobale,
          scoreNutrition: formData.scoreNutrition,
          scoreSommeil: formData.scoreSommeil
        })
      });

      if (response.ok) {
        showAlert("Score santé ajouté avec succès!", "success");
        setFormData({ 
          scoreActivite: "", 
          scoreGlobale: "", 
          scoreNutrition: "", 
          scoreSommeil: "" 
        });
        setAddModal(false);
        fetchScores();
      } else {
        throw new Error('Erreur lors de l\'insertion');
      }
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // UPDATE - Ouvrir modal d'édition (manuel)
  const openEditModal = (score) => {
    setEditingScore(score);
    setFormData({
      scoreActivite: score.activite.value,
      scoreGlobale: score.globale.value,
      scoreNutrition: score.nutrition.value,
      scoreSommeil: score.sommeil.value
    });
    setEditModal(true);
  };

  // UPDATE - Sauvegarder (manuel)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const scoreId = editingScore.score.value.split('#')[1];
      const response = await fetch(`http://localhost:5000/api/scores-sante/${scoreId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoreActivite: formData.scoreActivite,
          scoreGlobale: formData.scoreGlobale,
          scoreNutrition: formData.scoreNutrition,
          scoreSommeil: formData.scoreSommeil
        })
      });

      if (response.ok) {
        showAlert("Score santé modifié avec succès!", "success");
        setEditModal(false);
        setEditingScore(null);
        setFormData({ scoreActivite: "", scoreGlobale: "", scoreNutrition: "", scoreSommeil: "" });
        fetchScores();
      } else {
        throw new Error('Erreur lors de la modification');
      }
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // DELETE (manuel avec confirmation)
  const handleDelete = async (scoreUri) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce score santé ?")) {
      try {
        const scoreId = scoreUri.split('#')[1];
        const response = await fetch(`http://localhost:5000/api/scores-sante/${scoreId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showAlert("Score santé supprimé avec succès!", "success");
          fetchScores();
        } else {
          throw new Error('Erreur lors de la suppression');
        }
      } catch (error) {
        showAlert("Erreur: " + error.message, "danger");
      }
    }
  };

  const handleChange = (e) => {
    const value = Math.min(100, Math.max(0, e.target.value));
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "danger";
  };

  const getScoreEvaluation = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    return "À améliorer";
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return "⭐";
    if (score >= 60) return "✅";
    return "⚠️";
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
                    <h5 className="text-white mb-0">🤖 Assistant IA - Scores Santé</h5>
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
                      <strong>Exemples :</strong> "Ajoute score activité 85", "Affiche les scores excellents", "Supprime un score"
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {["Ajoute activité 85 globale 78", "Affiche scores > 80", "Score nutrition 90", "Supprime un score"].map((example, idx) => (
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

            {/* CARTE PRINCIPALE DES SCORES */}
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <Col>
                    <h3 className="mb-0">⭐ Gestion des Scores Santé</h3>
                    {activeFilters.length > 0 && (
                      <small className="text-muted">
                        Affichage filtré par AI ({filteredScores.length} résultat(s))
                      </small>
                    )}
                  </Col>
                  <Col className="text-right">
                    <Button 
                      color="primary" 
                      onClick={openAddModal}
                      className="mr-2"
                    >
                      ➕ Ajouter un Score
                    </Button>
                    <Button 
                      color="info" 
                      size="sm" 
                      onClick={fetchScores}
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
                        placeholder="Rechercher par score, ID..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col lg="6" className="text-right">
                    <div className="d-flex align-items-center justify-content-end">
                      <Badge color="primary" className="p-2 mr-3">
                        {filteredScores.length} / {scores.length} résultats
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
                    <p className="mt-2">Chargement des scores santé...</p>
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
                            <span>💪 Activité</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('activite') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('activite', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('activite') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('activite', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📊 Globale</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('globale') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('globale', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('globale') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('globale', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>🍎 Nutrition</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('nutrition') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('nutrition', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('nutrition') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('nutrition', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>😴 Sommeil</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('sommeil') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('sommeil', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('sommeil') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('sommeil', 'desc')}
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
                      {filteredScores.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <div className="text-muted">
                              <i className="ni ni-chart-bar-32 ni-3x mb-3"></i>
                              <br />
                              {scores.length === 0 ? 'Aucun score santé trouvé' : 'Aucun résultat pour votre recherche'}
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
                                ➕ Ajouter le premier score
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredScores.map((score, index) => {
                          const activiteScore = parseInt(score.activite.value);
                          const globaleScore = parseInt(score.globale.value);
                          const nutritionScore = parseInt(score.nutrition.value);
                          const sommeilScore = parseInt(score.sommeil.value);
                          
                          return (
                            <tr key={index}>
                              <td className="border-0">
                                <Badge color="info" className="text-uppercase">
                                  {score.score.value.split('#')[1]}
                                </Badge>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">{getScoreIcon(activiteScore)}</span>
                                  <div>
                                    <Badge color={getScoreColor(activiteScore)} className="mr-2">
                                      {score.activite.value}
                                    </Badge>
                                    <br />
                                    <small className="text-muted">
                                      {getScoreEvaluation(activiteScore)}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">{getScoreIcon(globaleScore)}</span>
                                  <div>
                                    <Badge color={getScoreColor(globaleScore)} className="mr-2">
                                      {score.globale.value}
                                    </Badge>
                                    <br />
                                    <small className="text-muted">
                                      {getScoreEvaluation(globaleScore)}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">{getScoreIcon(nutritionScore)}</span>
                                  <div>
                                    <Badge color={getScoreColor(nutritionScore)} className="mr-2">
                                      {score.nutrition.value}
                                    </Badge>
                                    <br />
                                    <small className="text-muted">
                                      {getScoreEvaluation(nutritionScore)}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">{getScoreIcon(sommeilScore)}</span>
                                  <div>
                                    <Badge color={getScoreColor(sommeilScore)} className="mr-2">
                                      {score.sommeil.value}
                                    </Badge>
                                    <br />
                                    <small className="text-muted">
                                      {getScoreEvaluation(sommeilScore)}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0 text-center">
                                <Button 
                                  color="warning" 
                                  size="sm" 
                                  className="mr-1"
                                  onClick={() => openEditModal(score)}
                                  title="Modifier"
                                >
                                  <i className="ni ni-ruler-pencil"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm"
                                  onClick={() => handleDelete(score.score.value)}
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
            Ajouter un Nouveau Score Santé
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="scoreActivite">
                      <i className="ni ni-user-run mr-1"></i>
                      Score Activité (0-100)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreActivite"
                      id="scoreActivite"
                      placeholder="Ex: 85"
                      value={formData.scoreActivite}
                      onChange={handleChange}
                      required
                    />
                    <small className="form-text text-muted">
                      Niveau d'activité physique
                    </small>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="scoreGlobale">
                      <i className="ni ni-chart-bar-32 mr-1"></i>
                      Score Globale (0-100)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreGlobale"
                      id="scoreGlobale"
                      placeholder="Ex: 78"
                      value={formData.scoreGlobale}
                      onChange={handleChange}
                      required
                    />
                    <small className="form-text text-muted">
                      Score santé global
                    </small>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="scoreNutrition">
                      <i className="ni ni-ungroup mr-1"></i>
                      Score Nutrition (0-100)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreNutrition"
                      id="scoreNutrition"
                      placeholder="Ex: 80"
                      value={formData.scoreNutrition}
                      onChange={handleChange}
                      required
                    />
                    <small className="form-text text-muted">
                      Qualité de l'alimentation
                    </small>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="scoreSommeil">
                      <i className="ni ni-watch-time mr-1"></i>
                      Score Sommeil (0-100)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreSommeil"
                      id="scoreSommeil"
                      placeholder="Ex: 75"
                      value={formData.scoreSommeil}
                      onChange={handleChange}
                      required
                    />
                    <small className="form-text text-muted">
                      Qualité du sommeil
                    </small>
                  </FormGroup>
                </Col>
              </Row>
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-primary mb-2">
                  <i className="ni ni-notification-70 mr-1"></i>
                  Échelle d'évaluation :
                </h6>
                <div className="d-flex justify-content-between text-sm">
                  <span><Badge color="success">80-100</Badge> Excellent</span>
                  <span><Badge color="warning">60-79</Badge> Bon</span>
                  <span><Badge color="danger">0-59</Badge> À améliorer</span>
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
                Ajouter le Score
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* MODAL D'ÉDITION (manuel) */}
        <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)} size="lg">
          <ModalHeader toggle={() => setEditModal(!editModal)}>
            <i className="ni ni-ruler-pencil mr-2"></i>
            Modifier le Score Santé
          </ModalHeader>
          <Form onSubmit={handleUpdate}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-scoreActivite">Score Activité</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreActivite"
                      id="edit-scoreActivite"
                      value={formData.scoreActivite}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-scoreGlobale">Score Globale</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreGlobale"
                      id="edit-scoreGlobale"
                      value={formData.scoreGlobale}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-scoreNutrition">Score Nutrition</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreNutrition"
                      id="edit-scoreNutrition"
                      value={formData.scoreNutrition}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-scoreSommeil">Score Sommeil</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="scoreSommeil"
                      id="edit-scoreSommeil"
                      value={formData.scoreSommeil}
                      onChange={handleChange}
                      required
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

export default ScoreSanteForm;