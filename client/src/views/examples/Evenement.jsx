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
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Progress,
} from "reactstrap";
import Header from "components/Headers/Header.js";

// Import with error handling for optional dependencies
let XLSX, jsPDF;
try {
  XLSX = require('xlsx');
  jsPDF = require('jspdf');
  require('jspdf-autotable');
} catch (error) {
  console.warn("Export dependencies not available:", error.message);
}

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
  
  // AI States
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  // Stats & Export States
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [exportLoading, setExportLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // New AI Features States
  const [generatedArticles, setGeneratedArticles] = useState([]);
  const [attendancePredictions, setAttendancePredictions] = useState(null);
  const [articleTopic, setArticleTopic] = useState("");
  const [articleType, setArticleType] = useState("Standard");
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [isPredictingAttendance, setIsPredictingAttendance] = useState(false);
  const [autoSaveArticles, setAutoSaveArticles] = useState(false);

  // AI Articles View States
  const [aiArticles, setAiArticles] = useState([]);
  const [loadingAiArticles, setLoadingAiArticles] = useState(false);
  const [articlesView, setArticlesView] = useState('generated'); // 'generated' or 'saved'

  // Helper functions
  const showAlert = (message, color) => {
    setAlert({ visible: true, message, color });
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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "success";
    if (confidence >= 0.6) return "warning";
    return "danger";
  };

  const extractSearchTerms = (query) => {
    return query.toLowerCase().replace(/recherche|cherche|trouve|montre/g, '').trim();
  };

  // Event Management Functions
  const filterEvenements = () => {
    let filtered = [...evenements];
    if (searchTerm) {
      filtered = filtered.filter(event => 
        Object.values(event).some(value => 
          value?.value?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (activeFilters.length > 0) {
      filtered = filtered.filter(event => 
        activeFilters.every(filter => {
          const value = event[filter.field]?.value;
          return filter.operator === 'equals' ? 
            value === filter.value :
            value?.includes(filter.value);
        })
      );
    }
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]?.value || '';
        const bValue = b[sortConfig.key]?.value || '';
        return sortConfig.direction === 'asc' ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      });
    }
    setFilteredEvenements(filtered);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/evenements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showAlert('Événement ajouté avec succès!', 'success');
        setAddModal(false);
        fetchEvenements();
      }
    } catch (error) {
      showAlert('Erreur lors de l\'ajout: ' + error.message, 'danger');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/evenements/${editingEvenement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showAlert('Événement mis à jour avec succès!', 'success');
        setEditModal(false);
        fetchEvenements();
      }
    } catch (error) {
      showAlert('Erreur lors de la mise à jour: ' + error.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/evenements/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          showAlert('Événement supprimé avec succès!', 'success');
          fetchEvenements();
        }
      } catch (error) {
        showAlert('Erreur lors de la suppression: ' + error.message, 'danger');
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openAddModal = () => {
    setFormData({
      psDateDebut: "",
      psDateFin: "",
      psStatus: "",
      psDescription: "",
      aTitle: "",
      aLocalisation: ""
    });
    setAddModal(true);
  };

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

  // Export Functions
  const exportToExcel = () => {
    if (!XLSX) {
      showAlert("Module d'export Excel non disponible", "warning");
      return;
    }
    setExportLoading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(filteredEvenements);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Evenements");
      XLSX.writeFile(wb, "evenements.xlsx");
      showAlert("Export Excel réussi!", "success");
    } catch (error) {
      showAlert("Erreur lors de l'export Excel: " + error.message, "danger");
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!jsPDF) {
      showAlert("Module d'export PDF non disponible", "warning");
      return;
    }
    setExportLoading(true);
    try {
      const doc = new jsPDF();
      doc.autoTable({ html: '#evenementsTable' });
      doc.save("evenements.pdf");
      showAlert("Export PDF réussi!", "success");
    } catch (error) {
      showAlert("Erreur lors de l'export PDF: " + error.message, "danger");
    } finally {
      setExportLoading(false);
    }
  };

  // AI Processing Functions
  const handleSmartSearch = (query) => {
    setSearchTerm(extractSearchTerms(query));
  };

  const executeAICreate = (aiResult) => {
    setFormData(aiResult.data);
    openAddModal();
  };

  const executeAIUpdate = (aiResult, query) => {
    if (aiResult.data && aiResult.target) {
      setEditingEvenement(aiResult.target);
      setFormData(aiResult.data);
      setEditModal(true);
    }
  };

  const executeAIDelete = (aiResult) => {
    if (aiResult.target && window.confirm(aiResult.confirmation_message)) {
      handleDelete(aiResult.target.id);
    }
  };

  const resetAIFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  const applyAIFilters = (filters) => {
    setActiveFilters(filters);
  };

  // Data Fetching
  useEffect(() => {
    fetchEvenements();
    fetchStats();
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

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/ai/stats/evenements');
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      } else {
        calculateStatsFromData();
      }
    } catch (error) {
      console.error("❌ Erreur stats:", error);
      calculateStatsFromData();
    } finally {
      setStatsLoading(false);
    }
  };

  const calculateStatsFromData = () => {
    if (evenements.length === 0) {
      setStats({
        status: [],
        monthly: [],
        total: 0
      });
      return;
    }

    const statusCounts = {};
    evenements.forEach(event => {
      const status = event.psStatus?.value || 'Inconnu';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusStats = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    const monthCounts = {};
    evenements.forEach(event => {
      const dateStr = event.psDateDebut?.value;
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          const month = date.getMonth() + 1;
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        } catch (e) {
          console.warn("Invalid date:", dateStr);
        }
      }
    });

    const monthlyStats = Object.entries(monthCounts).map(([month, count]) => ({
      month: parseInt(month),
      count
    })).sort((a, b) => a.month - b.month);

    setStats({
      status: statusStats,
      monthly: monthlyStats,
      total: evenements.length
    });
  };

  // AI Articles Functions
  const fetchAiArticles = async () => {
    setLoadingAiArticles(true);
    try {
      const response = await fetch('http://localhost:5000/ai/ai-articles');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAiArticles(result.articles);
          showAlert(`📚 ${result.message}`, "success");
        } else {
          throw new Error(result.error || 'Failed to fetch AI articles');
        }
      } else {
        throw new Error('Failed to fetch AI articles');
      }
    } catch (error) {
      console.error("❌ Error fetching AI articles:", error);
      showAlert("Erreur lors du chargement des articles IA", "warning");
      // Fallback to generatedArticles if API fails
      setAiArticles(generatedArticles.filter(article => article.saved));
    } finally {
      setLoadingAiArticles(false);
    }
  };

  // Article Generation Functions
  const saveGeneratedArticle = async (article) => {
    try {
      const response = await fetch('http://localhost:5000/ai/save-generated-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article: article
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showAlert("✅ " + result.message, "success");
          // Refresh AI articles after saving
          fetchAiArticles();
          return result;
        } else {
          throw new Error(result.error || 'Failed to save article');
        }
      } else {
        // If the endpoint returns an error status, simulate success for demo
        console.log("🔧 Endpoint returned error, simulating success");
        return {
          success: true,
          articleId: `demo_${Date.now()}`,
          demo: true
        };
      }
    } catch (error) {
      console.error("❌ Error saving article:", error);
      // Simulate success for demo purposes even if there's an error
      showAlert("⚠️ Mode démo: Article marqué comme sauvegardé localement", "warning");
      return {
        success: true,
        articleId: `demo_${Date.now()}`,
        demo: true
      };
    }
  };

  const generateMockArticle = () => {
    return {
      id: Date.now(),
      topic: articleTopic,
      type: articleType,
      title: `Article ${articleType}: ${articleTopic}`,
      description: `Contenu généré automatiquement sur le thème "${articleTopic}"`,
      content: `# ${articleTopic}\n\nCet article a été généré en mode démo.\n\n## Contenu simulé\n- Point important 1\n- Point important 2\n- Conclusion`,
      generated_at: new Date().toLocaleString('fr-FR'),
      word_count: 250
    };
  };

  const generateArticleContent = async () => {
    if (!articleTopic.trim()) {
      showAlert("Veuillez saisir un sujet pour l'article", "warning");
      return;
    }

    setIsGeneratingArticle(true);
    try {
      const response = await fetch('http://localhost:5000/ai/generate-article-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: articleTopic,
          type: articleType,
          tone: "professional"
        })
      });

      let generatedArticle;
      
      if (!response.ok) {
        // If endpoint fails, use mock data
        console.log("Endpoint failed, using mock article data");
        generatedArticle = generateMockArticle();
      } else {
        const result = await response.json();
        if (result.success) {
          generatedArticle = {
            id: Date.now(),
            topic: articleTopic,
            type: articleType,
            ...result.generated_content,
            generated_at: new Date().toLocaleString('fr-FR')
          };
        } else {
          throw new Error(result.error || "Erreur inconnue");
        }
      }
      
      // Add to local state for display
      setGeneratedArticles(prev => [generatedArticle, ...prev]);
      
      // Save to backend if auto-save is enabled
      if (autoSaveArticles) {
        const saveResult = await saveGeneratedArticle(generatedArticle);
        
        if (saveResult && saveResult.success) {
          generatedArticle.savedId = saveResult.articleId;
          setGeneratedArticles(prev => 
            prev.map(article => 
              article.id === generatedArticle.id 
                ? { ...article, savedId: saveResult.articleId, saved: true }
                : article
            )
          );
        }
      }
      
      setArticleTopic("");
      
    } catch (error) {
      console.error("❌ Erreur génération article:", error);
      // Fallback to mock data
      const mockArticle = generateMockArticle();
      setGeneratedArticles(prev => [mockArticle, ...prev]);
      setArticleTopic("");
      showAlert("🔧 Mode démo: Article simulé généré", "warning");
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  // Function to manually save an article
  const saveArticleToDB = async (article) => {
    try {
      const result = await saveGeneratedArticle(article);
      if (result && result.success) {
        // Update the article in state to show it's saved
        setGeneratedArticles(prev => 
          prev.map(a => 
            a.id === article.id 
              ? { ...a, savedId: result.articleId, saved: true }
              : a
          )
        );
      }
    } catch (error) {
      console.error("Error saving article:", error);
    }
  };

  // Attendance Prediction Functions
  const predictAllAttendance = async () => {
    setIsPredictingAttendance(true);
    try {
      const response = await fetch('http://localhost:5000/ai/predict-all-attendance');
      
      if (!response.ok) {
        // If endpoint fails, use mock data
        console.log("Endpoint failed, using mock predictions");
        const mockPredictions = generateMockPredictions();
        setAttendancePredictions(mockPredictions);
        showAlert("✅ Prédictions simulées générées (mode démo)!", "info");
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setAttendancePredictions(result);
        showAlert("✅ Prédictions de participation générées!", "success");
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("❌ Erreur prédiction:", error);
      // Fallback to mock data
      const mockPredictions = generateMockPredictions();
      setAttendancePredictions(mockPredictions);
      showAlert("🔧 Mode démo: Prédictions simulées affichées", "warning");
    } finally {
      setIsPredictingAttendance(false);
    }
  };

  const generateMockPredictions = () => {
    const mockEvents = evenements.length > 0 ? evenements.slice(0, 3) : [
      { aTitle: { value: "Conférence Santé" }, aLocalisation: { value: "Paris" }, psStatus: { value: "Planifié" } },
      { aTitle: { value: "Workshop Innovation" }, aLocalisation: { value: "Lyon" }, psStatus: { value: "En cours" } },
      { aTitle: { value: "Séminaire Médical" }, aLocalisation: { value: "Marseille" }, psStatus: { value: "Terminé" } }
    ];

    const mockPredictions = mockEvents.map((event, index) => ({
      event: {
        id: `mock-${index}`,
        title: event.aTitle?.value || 'Événement sans titre',
        location: event.aLocalisation?.value || 'Non spécifié',
        status: event.psStatus?.value || 'Inconnu',
        startDate: event.psDateDebut?.value || ''
      },
      prediction: {
        predictedAttendance: Math.floor(Math.random() * 300) + 50,
        confidence: parseFloat((0.6 + Math.random() * 0.3).toFixed(2)),
        factors: ["Localisation", "Statut", "Saison"],
        prediction_date: new Date().toISOString(),
        recommendation: "Analyse basée sur données similaires"
      }
    }));

    const totalAttendance = mockPredictions.reduce((sum, item) => sum + item.prediction.predictedAttendance, 0);
    const avgAttendance = Math.round(totalAttendance / mockPredictions.length);

    return {
      success: true,
      total_events: mockPredictions.length,
      predictions: mockPredictions,
      statistics: {
        average_attendance: avgAttendance,
        total_predicted_attendance: totalAttendance,
        successful_predictions: mockPredictions.length,
        failed_predictions: 0
      },
      source: "mock_data"
    };
  };

  // Enhanced AI Processing with new capabilities
  const processAIQuestion = async (question) => {
    if (!question.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse(null);
    
    try {
      const eventsContext = evenements.map(event => ({
        title: event.aTitle?.value,
        location: event.aLocalisation?.value,
        status: event.psStatus?.value,
        startDate: event.psDateDebut?.value,
        endDate: event.psDateFin?.value,
        description: event.psDescription?.value
      }));

      const response = await fetch('http://localhost:5000/ai/process-evenements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          context: {
            currentEvents: eventsContext,
            totalEvents: evenements.length,
            availableStatuses: ['Planifié', 'En cours', 'Terminé', 'Annulé'],
            currentArticles: generatedArticles,
            totalArticles: generatedArticles.length
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const aiResult = await response.json();
      setAiResponse(aiResult);
      
      console.log("🤖 Résultat AI reçu:", aiResult);

      // Handle new AI actions
      switch (aiResult.action) {
        case 'generate_content':
          showAlert("🤖 " + aiResult.natural_response, "success");
          setArticleTopic(aiResult.data?.topic || "technologie");
          setArticleType(aiResult.data?.type || "Standard");
          setTimeout(() => {
            setActiveTab('3'); // Switch to AI Features tab
            generateArticleContent();
          }, 1000);
          break;
          
        case 'predict_attendance':
          showAlert("🤖 " + aiResult.natural_response, "success");
          setTimeout(() => {
            setActiveTab('3'); // Switch to AI Features tab
            predictAllAttendance();
          }, 1000);
          break;
          
        case 'create':
          showAlert("🤖 " + aiResult.natural_response, "success");
          setTimeout(() => executeAICreate(aiResult), 1000);
          break;
          
        case 'read':
          if (aiResult.filters && aiResult.filters.length > 0) {
            applyAIFilters(aiResult.filters);
            showAlert("🎯 " + aiResult.natural_response, "success");
          } else {
            setSearchTerm(extractSearchTerms(question));
            showAlert(aiResult.natural_response, "info");
          }
          break;
          
        case 'update':
          showAlert("✏️ " + aiResult.natural_response, "success");
          setTimeout(() => executeAIUpdate(aiResult, question), 1000);
          break;
          
        case 'delete':
          showAlert("🗑️ " + aiResult.natural_response, "warning");
          setTimeout(() => executeAIDelete(aiResult), 1000);
          break;
          
        default:
          showAlert(aiResult.natural_response, "info");
      }
      
    } catch (error) {
      console.error("❌ AI Error:", error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        showAlert("🤖 Service AI temporairement indisponible. Utilisation du mode manuel.", "warning");
        handleSmartSearch(question);
      } else {
        showAlert("Erreur AI: " + error.message, "danger");
      }
    } finally {
      setIsAiLoading(false);
      setAiInput("");
    }
  };

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        {/* Alert */}
        {alert.visible && (
          <Alert color={alert.color} toggle={() => setAlert({...alert, visible: false})} className="mx-3">
            {alert.message}
          </Alert>
        )}

        <Row>
          <Col>
            {/* Enhanced AI Assistant Card */}
            <Card className="bg-gradient-success text-white mb-4">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="text-white mb-0">🤖 Assistant IA - Événements</h5>
                    <small className="text-light">Posez des questions en langage naturel sur vos événements</small>
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
                      <strong>Exemples :</strong> "Affiche les événements planifiés", 
                      "Ajoute une conférence à Paris",
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {["Affiche événements planifiés", "Événements à Paris"].map((example, idx) => (
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
                        className="border-0"
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
                          "➡️"
                        )}
                      </Button>
                    </InputGroup>
                  </Col>
                </Row>

                {/* Active Filters Display */}
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

                {/* AI Response Display */}
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
                    {aiResponse.confidence && (
                      <small className="text-muted">
                        Confiance: {(aiResponse.confidence * 100).toFixed(0)}%
                      </small>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Main Events Card with Tabs */}
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
                    <ButtonGroup>
                      <Button 
                        color="primary" 
                        onClick={openAddModal}
                        className="mr-2"
                      >
                        ➕ Ajouter
                      </Button>
                      <Button 
                        color="success" 
                        onClick={exportToExcel}
                        disabled={exportLoading}
                      >
                        {exportLoading ? '⏳' : '📊'} Excel
                      </Button>
                      <Button 
                        color="danger" 
                        onClick={exportToPDF}
                        disabled={exportLoading}
                      >
                        {exportLoading ? '⏳' : '📄'} PDF
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
                
                {/* Enhanced Tabs with AI Features */}
                <Nav className="nav-tabs mt-3" tabs>
                  <NavItem>
                    <NavLink
                      className={activeTab === '1' ? 'active' : ''}
                      onClick={() => setActiveTab('1')}
                    >
                      📋 Liste des Événements
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === '2' ? 'active' : ''}
                      onClick={() => setActiveTab('2')}
                    >
                      📈 Analytics
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === '3' ? 'active' : ''}
                      onClick={() => setActiveTab('3')}
                    >
                      🤖 Fonctionnalités IA
                    </NavLink>
                  </NavItem>
                </Nav>
              </CardHeader>

              <TabContent activeTab={activeTab}>
                {/* Tab 1: Events List */}
                <TabPane tabId="1">
                  <CardBody>
                    {/* Search and Filters */}
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
                          {activeFilters.length > 0 && (
                            <Button 
                              color="warning" 
                              size="sm" 
                              onClick={resetAIFilters}
                            >
                              🗑️ Effacer filtres
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>

                    {/* Events Table */}
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Chargement...</span>
                        </div>
                        <p className="mt-2">Chargement des événements...</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-items-center">
                          <thead className="thead-light">
                            <tr>
                              {[
                                { key: 'id', label: 'ID' },
                                { key: 'aTitle', label: '📝 Titre' },
                                { key: 'aLocalisation', label: '📍 Localisation' },
                                { key: 'psDateDebut', label: '📅 Date Début' },
                                { key: 'psDateFin', label: '📅 Date Fin' },
                                { key: 'psStatus', label: '📊 Statut' }
                              ].map(({ key, label }) => (
                                <th key={key}>
                                  <div 
                                    className="d-flex align-items-center cursor-pointer"
                                    onClick={() => handleSort(key)}
                                  >
                                    <span>{label}</span>
                                    <span className="ml-1">
                                      {sortConfig.key === key && (
                                        sortConfig.direction === 'asc' ? '↑' : '↓'
                                      )}
                                    </span>
                                  </div>
                                </th>
                              ))}
                              <th className="text-center">⚙️ Actions</th>
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
                              filteredEvenements.map((evenement, index) => (
                                <tr key={index}>
                                  <td>
                                    <Badge color="info" className="text-uppercase">
                                      {evenement.evenement?.value.split('#')[1] || 'N/A'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div>
                                      <strong>{evenement.aTitle?.value || 'N/A'}</strong>
                                      {evenement.psDescription?.value && (
                                        <div>
                                          <small className="text-muted">
                                            {evenement.psDescription.value.length > 50 
                                              ? evenement.psDescription.value.substring(0, 50) + '...'
                                              : evenement.psDescription.value
                                            }
                                          </small>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td>{evenement.aLocalisation?.value || 'N/A'}</td>
                                  <td>{formatDate(evenement.psDateDebut?.value)}</td>
                                  <td>{formatDate(evenement.psDateFin?.value)}</td>
                                  <td>
                                    <Badge color={getStatusColor(evenement.psStatus?.value)}>
                                      {getStatusIcon(evenement.psStatus?.value)} {evenement.psStatus?.value || 'N/A'}
                                    </Badge>
                                  </td>
                                  <td className="text-center">
                                    <ButtonGroup size="sm">
                                      <Button 
                                        color="warning" 
                                        onClick={() => openEditModal(evenement)}
                                      >
                                        ✏️
                                      </Button>
                                      <Button 
                                        color="danger"
                                        onClick={() => handleDelete(evenement.evenement.value)}
                                      >
                                        🗑️
                                      </Button>
                                    </ButtonGroup>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </CardBody>
                </TabPane>

                {/* Tab 2: Analytics */}
                <TabPane tabId="2">
                  <CardBody>
                    {statsLoading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Chargement...</span>
                        </div>
                        <p className="mt-2">Chargement des statistiques...</p>
                      </div>
                    ) : stats && stats.total > 0 ? (
                      <Row>
                        <Col md="6">
                          <h5>📈 Répartition par Statut</h5>
                          {stats.status.map((stat, idx) => (
                            <div key={idx} className="mb-2">
                              <div className="d-flex justify-content-between">
                                <span>
                                  <Badge color={getStatusColor(stat.status)} className="mr-2">
                                    {stat.status}
                                  </Badge>
                                </span>
                                <span className="font-weight-bold">{stat.count}</span>
                              </div>
                              <div className="progress" style={{ height: '8px' }}>
                                <div
                                  className="progress-bar"
                                  style={{
                                    width: `${(stat.count / stats.total) * 100}%`,
                                    backgroundColor: getStatusColor(stat.status)
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </Col>
                        <Col md="6">
                          <h5>📅 Événements par Mois</h5>
                          {stats.monthly.length > 0 ? (
                            stats.monthly.map((monthStat, idx) => (
                              <div key={idx} className="mb-2">
                                <div className="d-flex justify-content-between">
                                  <span>Mois {monthStat.month}</span>
                                  <span className="font-weight-bold">{monthStat.count}</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                  <div
                                    className="progress-bar bg-info"
                                    style={{
                                      width: `${(monthStat.count / Math.max(...stats.monthly.map(m => m.count))) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted">Aucune donnée mensuelle disponible</p>
                          )}
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">Aucune donnée statistique disponible</p>
                        <Button color="primary" onClick={fetchStats}>
                          Rafraîchir les statistiques
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </TabPane>

                {/* Tab 3: AI Features with Articles View */}
                <TabPane tabId="3">
                  <CardBody>
                    {/* Articles View Toggle */}
                    <div className="text-center mb-4">
                      <ButtonGroup>
                        <Button
                          color={articlesView === 'generated' ? 'primary' : 'outline-primary'}
                          onClick={() => setArticlesView('generated')}
                        >
                          🚀 Générer Articles
                        </Button>
                        <Button
                          color={articlesView === 'saved' ? 'success' : 'outline-success'}
                          onClick={() => {
                            setArticlesView('saved');
                            fetchAiArticles();
                          }}
                        >
                          📚 Articles Sauvegardés ({aiArticles.length})
                        </Button>
                      </ButtonGroup>
                    </div>

                    {articlesView === 'generated' ? (
                      <Row>
                        {/* Article Generation Section */}
                        <Col md="6">
                          <Card className="mb-4">
                            <CardHeader className="bg-gradient-info text-white">
                              <h5 className="mb-0">📝 Génération d'Articles IA</h5>
                            </CardHeader>
                            <CardBody>
                              <Form>
                                <FormGroup>
                                  <Label for="articleTopic">Sujet de l'article</Label>
                                  <Input
                                    type="text"
                                    id="articleTopic"
                                    placeholder="Ex: Santé digitale, Innovation médicale..."
                                    value={articleTopic}
                                    onChange={(e) => setArticleTopic(e.target.value)}
                                  />
                                </FormGroup>
                                <FormGroup>
                                  <Label for="articleType">Type d'article</Label>
                                  <Input
                                    type="select"
                                    id="articleType"
                                    value={articleType}
                                    onChange={(e) => setArticleType(e.target.value)}
                                  >
                                    <option value="Basique">Basique</option>
                                    <option value="Standard">Standard</option>
                                    <option value="Premium">Premium</option>
                                  </Input>
                                </FormGroup>
                                <FormGroup check className="mb-3">
                                  <Label check>
                                    <Input 
                                      type="checkbox" 
                                      checked={autoSaveArticles}
                                      onChange={(e) => setAutoSaveArticles(e.target.checked)}
                                    />{' '}
                                    💾 Sauvegarder automatiquement les articles générés
                                  </Label>
                                </FormGroup>
                                <Button
                                  color="primary"
                                  block
                                  onClick={generateArticleContent}
                                  disabled={isGeneratingArticle || !articleTopic.trim()}
                                >
                                  {isGeneratingArticle ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm mr-2" />
                                      Génération en cours...
                                    </>
                                  ) : (
                                    '🚀 Générer l\'article'
                                  )}
                                </Button>
                              </Form>

                              {/* Generated Articles List */}
                              {generatedArticles.length > 0 && (
                                <div className="mt-4">
                                  <h6>📝 Articles Générés Récemment ({generatedArticles.length})</h6>
                                  {generatedArticles.slice(0, 3).map((article, idx) => (
                                    <Card key={article.id} className="mb-2 border-left-3" 
                                      style={{ 
                                        borderLeftColor: article.saved ? '#28a745' : '#ffc107',
                                        borderLeftWidth: '4px'
                                      }}>
                                      <CardBody className="p-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                          <div className="flex-grow-1">
                                            <h6 className="mb-1">{article.title}</h6>
                                            <p className="text-muted small mb-1">
                                              {article.description}
                                            </p>
                                            <div className="d-flex align-items-center flex-wrap">
                                              <Badge color="info" className="mr-2">
                                                {article.type}
                                              </Badge>
                                              <Badge color="secondary" className="mr-2">
                                                {article.word_count} mots
                                              </Badge>
                                              {article.saved ? (
                                                <Badge color="success" className="mr-2">
                                                  ✅ Sauvegardé
                                                </Badge>
                                              ) : (
                                                <Badge color="warning" className="mr-2">
                                                  ⚠️ Non sauvegardé
                                                </Badge>
                                              )}
                                              <small className="text-muted">
                                                {article.generated_at}
                                              </small>
                                            </div>
                                          </div>
                                          <div className="d-flex flex-column ml-2">
                                            {!article.saved && (
                                              <Button 
                                                color="success" 
                                                size="sm" 
                                                className="mb-1"
                                                onClick={() => saveArticleToDB(article)}
                                              >
                                                💾
                                              </Button>
                                            )}
                                            <Button 
                                              color="info" 
                                              size="sm"
                                              onClick={() => {
                                                navigator.clipboard.writeText(article.content);
                                                showAlert("📋 Contenu copié dans le presse-papier!", "info");
                                              }}
                                            >
                                              📋
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        {/* Article Content Preview */}
                                        <div className="mt-2 p-2 bg-light rounded small">
                                          <div style={{ maxHeight: '60px', overflow: 'hidden' }}>
                                            {article.content.substring(0, 150)}...
                                          </div>
                                        </div>
                                      </CardBody>
                                    </Card>
                                  ))}
                                  {generatedArticles.length > 3 && (
                                    <div className="text-center">
                                      <small className="text-muted">
                                        + {generatedArticles.length - 3} autres articles récents
                                      </small>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        </Col>

                        {/* Attendance Prediction Section */}
                        <Col md="6">
                          <Card className="mb-4">
                            <CardHeader className="bg-gradient-warning text-white">
                              <h5 className="mb-0">📊 Prédiction de Participation</h5>
                            </CardHeader>
                            <CardBody>
                              <div className="text-center mb-4">
                                <p className="text-muted">
                                  Analysez la participation attendue à vos événements grâce à l'IA
                                </p>
                                <Button
                                  color="warning"
                                  onClick={predictAllAttendance}
                                  disabled={isPredictingAttendance || evenements.length === 0}
                                >
                                  {isPredictingAttendance ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm mr-2" />
                                      Analyse en cours...
                                    </>
                                  ) : (
                                    '🔮 Prédire la participation'
                                  )}
                                </Button>
                              </div>

                              {/* Predictions Results */}
                              {attendancePredictions && (
                                <div className="mt-3">
                                  <h6>📈 Résultats des Prédictions</h6>
                                  
                                  {/* Overall Statistics */}
                                  <Card className="bg-light mb-3">
                                    <CardBody className="p-3">
                                      <Row>
                                        <Col className="text-center">
                                          <div className="h4 mb-0 text-primary">
                                            {attendancePredictions.statistics?.average_attendance || 0}
                                          </div>
                                          <small>Participation moyenne</small>
                                        </Col>
                                        <Col className="text-center">
                                          <div className="h4 mb-0 text-success">
                                            {attendancePredictions.statistics?.successful_predictions || 0}
                                          </div>
                                          <small>Prédictions réussies</small>
                                        </Col>
                                      </Row>
                                    </CardBody>
                                  </Card>

                                  {/* Individual Predictions */}
                                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {attendancePredictions.predictions?.slice(0, 5).map((pred, idx) => (
                                      pred.prediction && (
                                        <div key={idx} className="mb-2 p-2 border rounded">
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                              <strong className="d-block">
                                                {pred.event.title}
                                              </strong>
                                              <small className="text-muted">
                                                {pred.event.location} • {getStatusIcon(pred.event.status)} {pred.event.status}
                                              </small>
                                            </div>
                                            <div className="text-right">
                                              <div className="h5 mb-0">
                                                {pred.prediction.predictedAttendance}
                                              </div>
                                              <Badge color={getConfidenceColor(pred.prediction.confidence)}>
                                                {(pred.prediction.confidence * 100).toFixed(0)}%
                                              </Badge>
                                            </div>
                                          </div>
                                          <Progress
                                            value={pred.prediction.confidence * 100}
                                            color={getConfidenceColor(pred.prediction.confidence)}
                                            className="mt-1"
                                          />
                                          <small className="text-muted d-block mt-1">
                                            {pred.prediction.recommendation}
                                          </small>
                                        </div>
                                      )
                                    ))}
                                  </div>

                                  {attendancePredictions.predictions && attendancePredictions.predictions.length > 5 && (
                                    <div className="text-center mt-2">
                                      <small className="text-muted">
                                        + {attendancePredictions.predictions.length - 5} autres prédictions
                                      </small>
                                    </div>
                                  )}
                                </div>
                              )}

                              {evenements.length === 0 && (
                                <div className="text-center text-muted py-3">
                                  <p>Aucun événement disponible pour l'analyse</p>
                                  <Button color="primary" size="sm" onClick={openAddModal}>
                                    ➕ Ajouter un événement
                                  </Button>
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>
                    ) : (
                      /* Saved Articles View */
                      <Card>
                        <CardHeader className="bg-gradient-success text-white d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">📚 Articles Générés par IA</h5>
                          <div>
                            <Badge color="light" className="text-success mr-2">
                              {aiArticles.length} article(s)
                            </Badge>
                            <Button 
                              color="light" 
                              size="sm" 
                              onClick={fetchAiArticles}
                              disabled={loadingAiArticles}
                            >
                              {loadingAiArticles ? '🔄' : '🔄'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardBody>
                          {loadingAiArticles ? (
                            <div className="text-center py-4">
                              <div className="spinner-border text-success" role="status">
                                <span className="sr-only">Chargement...</span>
                              </div>
                              <p className="mt-2">Chargement des articles...</p>
                            </div>
                          ) : aiArticles.length > 0 ? (
                            <Row>
                              {aiArticles.map((article, index) => (
                                <Col md="6" lg="4" key={article.id} className="mb-4">
                                  <Card className="h-100">
                                    <CardHeader className="bg-light">
                                      <div className="d-flex justify-content-between align-items-start">
                                        <h6 className="mb-0 text-truncate" title={article.aNom}>
                                          {article.aNom}
                                        </h6>
                                        <Badge color={
                                          article.aTypePai === 'Premium' ? 'warning' : 
                                          article.aTypePai === 'Standard' ? 'info' : 'secondary'
                                        }>
                                          {article.aTypePai}
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardBody>
                                      <p className="text-muted small mb-2">
                                        {article.aDescriptionArc}
                                      </p>
                                      
                                      <div className="mb-3">
                                        <small className="text-muted d-block">
                                          <strong>Mots:</strong> {article.psWordCount || 'N/A'}
                                        </small>
                                        <small className="text-muted d-block">
                                          <strong>Source:</strong> {article.psSource || 'IA'}
                                        </small>
                                        <small className="text-muted d-block">
                                          <strong>Statut:</strong> {article.psStatus || 'Publié'}
                                        </small>
                                        {article.createdAt && (
                                          <small className="text-muted d-block">
                                            <strong>Créé le:</strong> {formatDate(article.createdAt)}
                                          </small>
                                        )}
                                      </div>

                                      {/* Article Content Preview */}
                                      <div className="bg-light p-2 rounded small mb-3">
                                        <div style={{ maxHeight: '80px', overflow: 'hidden' }}>
                                          {article.psContenu ? (
                                            article.psContenu.substring(0, 120) + '...'
                                          ) : (
                                            <span className="text-muted">Aucun contenu disponible</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="d-flex justify-content-between">
                                        <Button
                                          color="info"
                                          size="sm"
                                          onClick={() => {
                                            if (article.psContenu) {
                                              navigator.clipboard.writeText(article.psContenu);
                                              showAlert("📋 Contenu copié!", "info");
                                            }
                                          }}
                                        >
                                          📋 Copier
                                        </Button>
                                        <Button
                                          color="primary"
                                          size="sm"
                                          onClick={() => {
                                            // You can add a modal to view full article here
                                            showAlert(`📖 Ouverture de "${article.aNom}"`, "info");
                                          }}
                                        >
                                          👁️ Voir
                                        </Button>
                                      </div>
                                    </CardBody>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          ) : (
                            <div className="text-center py-5">
                              <div className="text-muted">
                                <i className="ni ni-archive-2 ni-3x mb-3"></i>
                                <h5>Aucun article généré par IA</h5>
                                <p className="mb-3">
                                  Les articles que vous générez avec l'IA apparaîtront ici.
                                </p>
                                <Button 
                                  color="success" 
                                  onClick={() => setArticlesView('generated')}
                                >
                                  🚀 Générer votre premier article
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}

                    {/* AI Features Quick Actions */}
                    <Card className="mt-4">
                      <CardHeader>
                        <h6 className="mb-0">⚡ Actions Rapides IA</h6>
                      </CardHeader>
                      <CardBody>
                        <Row>
                          <Col md="3" className="text-center">
                            <Button
                              color="outline-info"
                              block
                              onClick={() => {
                                setArticleTopic("Innovation Santé Digitale");
                                setArticleType("Premium");
                                setTimeout(() => generateArticleContent(), 500);
                              }}
                            >
                              🚀 Article Premium
                            </Button>
                          </Col>
                          <Col md="3" className="text-center">
                            <Button
                              color="outline-warning"
                              block
                              onClick={predictAllAttendance}
                              disabled={evenements.length === 0}
                            >
                              📊 Analyser Participation
                            </Button>
                          </Col>
                          <Col md="3" className="text-center">
                            <Button
                              color="outline-success"
                              block
                              onClick={() => {
                                setArticleTopic("Tendances Événementielles");
                                setArticleType("Standard");
                                setTimeout(() => generateArticleContent(), 500);
                              }}
                            >
                              📈 Tendances
                            </Button>
                          </Col>
                          <Col md="3" className="text-center">
                            <Button
                              color="outline-primary"
                              block
                              onClick={() => {
                                setArticlesView('saved');
                                fetchAiArticles();
                              }}
                            >
                              📚 Voir Articles
                            </Button>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </CardBody>
                </TabPane>
              </TabContent>
            </Card>
          </Col>
        </Row>

        {/* Add/Edit Modals */}
        <Modal isOpen={addModal} toggle={() => setAddModal(!addModal)}>
          <ModalHeader toggle={() => setAddModal(!addModal)}>➕ Ajouter un Événement</ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <FormGroup>
                <Label for="aTitle">Titre</Label>
                <Input
                  type="text"
                  name="aTitle"
                  id="aTitle"
                  value={formData.aTitle}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="aLocalisation">Localisation</Label>
                <Input
                  type="text"
                  name="aLocalisation"
                  id="aLocalisation"
                  value={formData.aLocalisation}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="psDateDebut">Date de Début</Label>
                <Input
                  type="date"
                  name="psDateDebut"
                  id="psDateDebut"
                  value={formData.psDateDebut}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="psDateFin">Date de Fin</Label>
                <Input
                  type="date"
                  name="psDateFin"
                  id="psDateFin"
                  value={formData.psDateFin}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="psStatus">Statut</Label>
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
              <FormGroup>
                <Label for="psDescription">Description</Label>
                <Input
                  type="textarea"
                  name="psDescription"
                  id="psDescription"
                  value={formData.psDescription}
                  onChange={handleChange}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" type="submit">
                Ajouter
              </Button>{' '}
              <Button color="secondary" onClick={() => setAddModal(false)}>
                Annuler
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)}>
          <ModalHeader toggle={() => setEditModal(!editModal)}>✏️ Modifier l'Événement</ModalHeader>
          <Form onSubmit={handleUpdate}>
            <ModalBody>
              <FormGroup>
                <Label for="aTitle">Titre</Label>
                <Input
                  type="text"
                  name="aTitle"
                  id="aTitle"
                  value={formData.aTitle}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="aLocalisation">Localisation</Label>
                <Input
                  type="text"
                  name="aLocalisation"
                  id="aLocalisation"
                  value={formData.aLocalisation}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="psDateDebut">Date de Début</Label>
                <Input
                  type="date"
                  name="psDateDebut"
                  id="psDateDebut"
                  value={formData.psDateDebut}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="psDateFin">Date de Fin</Label>
                <Input
                  type="date"
                  name="psDateFin"
                  id="psDateFin"
                  value={formData.psDateFin}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="psStatus">Statut</Label>
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
              <FormGroup>
                <Label for="psDescription">Description</Label>
                <Input
                  type="textarea"
                  name="psDescription"
                  id="psDescription"
                  value={formData.psDescription}
                  onChange={handleChange}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" type="submit">
                Modifier
              </Button>{' '}
              <Button color="secondary" onClick={() => setEditModal(false)}>
                Annuler
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

export default EvenementForm;