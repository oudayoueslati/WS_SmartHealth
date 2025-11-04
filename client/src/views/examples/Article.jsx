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

const ArticleForm = () => {
  const [formData, setFormData] = useState({
    aNom: "",
    aDescriptionArc: "",
    aTypePai: "",
    aImageArct: "",
    evenementLie: ""
  });
  const [alert, setAlert] = useState({ visible: false, message: "", color: "" });
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [evenementsDisponibles, setEvenementsDisponibles] = useState([]);

  useEffect(() => {
    fetchArticles();
    fetchEvenementsDisponibles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchTerm, articles, sortConfig]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/articles');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("📦 Données articles reçues:", result);
      setArticles(result.results.bindings || []);
    } catch (error) {
      console.error("❌ Erreur fetch articles:", error);
      showAlert("Erreur lors du chargement des articles: " + error.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvenementsDisponibles = async () => {
    try {
      console.log("🔄 Chargement des événements disponibles...");
      const response = await fetch('http://localhost:5000/api/articles/evenements/disponibles');
      if (response.ok) {
        const result = await response.json();
        console.log("📋 Événements disponibles reçus:", result.evenements);
        setEvenementsDisponibles(result.evenements || []);
      } else {
        console.error("❌ Erreur lors du chargement des événements");
      }
    } catch (error) {
      console.error("❌ Erreur fetch événements:", error);
    }
  };

  const filterArticles = () => {
    let filtered = articles.filter(article => {
      const aNom = article.aNom?.value || '';
      const aDescriptionArc = article.aDescriptionArc?.value || '';
      const aTypePai = article.aTypePai?.value || '';
      const aImageArct = article.aImageArct?.value || '';
      const evenementTitre = article.evenementTitre?.value || '';
      const id = article.article?.value.split('#')[1] || '';

      const searchLower = searchTerm.toLowerCase();
      
      return (
        aNom.toString().toLowerCase().includes(searchLower) ||
        aDescriptionArc.toString().toLowerCase().includes(searchLower) ||
        aTypePai.toString().toLowerCase().includes(searchLower) ||
        aImageArct.toString().toLowerCase().includes(searchLower) ||
        evenementTitre.toString().toLowerCase().includes(searchLower) ||
        id.toLowerCase().includes(searchLower)
      );
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

    setFilteredArticles(filtered);
  };

  const getSortValue = (article, key) => {
    switch (key) {
      case 'aNom':
        return article.aNom?.value || '';
      case 'aDescriptionArc':
        return article.aDescriptionArc?.value || '';
      case 'aTypePai':
        return article.aTypePai?.value || '';
      case 'id':
        return article.article?.value.split('#')[1] || '';
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

  // Ouvrir modal d'ajout
  const openAddModal = () => {
    setFormData({ 
      aNom: "", 
      aDescriptionArc: "", 
      aTypePai: "", 
      aImageArct: "", 
      evenementLie: "" 
    });
    setAddModal(true);
  };

  // CREATE (manuel)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log("📤 Envoi des données:", formData);
      const response = await fetch('http://localhost:5000/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aNom: formData.aNom,
          aDescriptionArc: formData.aDescriptionArc,
          aTypePai: formData.aTypePai,
          aImageArct: formData.aImageArct,
          evenementLie: formData.evenementLie
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'insertion');
      }

      const result = await response.json();
      showAlert(result.message || "Article ajouté avec succès!", "success");
      setFormData({ 
        aNom: "", 
        aDescriptionArc: "", 
        aTypePai: "", 
        aImageArct: "", 
        evenementLie: "" 
      });
      setAddModal(false);
      fetchArticles();
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // UPDATE - Ouvrir modal d'édition (manuel)
  const openEditModal = (article) => {
    setEditingArticle(article);
    const evenementId = article.evenementLie?.value ? article.evenementLie.value.split('#')[1] : "";
    setFormData({
      aNom: article.aNom?.value || "",
      aDescriptionArc: article.aDescriptionArc?.value || "",
      aTypePai: article.aTypePai?.value || "",
      aImageArct: article.aImageArct?.value || "",
      evenementLie: evenementId
    });
    setEditModal(true);
  };

  // UPDATE - Sauvegarder (manuel)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const articleId = editingArticle.article.value.split('#')[1];
      console.log("📤 Mise à jour de l'article:", articleId, formData);
      const response = await fetch(`http://localhost:5000/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aNom: formData.aNom,
          aDescriptionArc: formData.aDescriptionArc,
          aTypePai: formData.aTypePai,
          aImageArct: formData.aImageArct,
          evenementLie: formData.evenementLie
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification');
      }

      const result = await response.json();
      showAlert(result.message || "Article modifié avec succès!", "success");
      setEditModal(false);
      setEditingArticle(null);
      setFormData({ 
        aNom: "", 
        aDescriptionArc: "", 
        aTypePai: "", 
        aImageArct: "", 
        evenementLie: "" 
      });
      fetchArticles();
    } catch (error) {
      showAlert("Erreur: " + error.message, "danger");
    }
  };

  // DELETE (manuel avec confirmation)
  const handleDelete = async (articleUri) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      try {
        const articleId = articleUri.split('#')[1];
        const response = await fetch(`http://localhost:5000/api/articles/${articleId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        const result = await response.json();
        showAlert(result.message || "Article supprimé avec succès!", "success");
        fetchArticles();
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

  const getTypePaiColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'premium':
        return "success";
      case 'standard':
        return "info";
      case 'basique':
        return "secondary";
      default:
        return "primary";
    }
  };

  const getTypePaiIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'premium':
        return "⭐";
      case 'standard':
        return "✅";
      case 'basique':
        return "📄";
      default:
        return "📝";
    }
  };

  const truncateText = (text, length = 50) => {
    if (!text) return 'N/A';
    return text.length > length ? text.substring(0, length) + '...' : text;
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
            {/* CARTE PRINCIPALE DES ARTICLES */}
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <Col>
                    <h3 className="mb-0">📰 Gestion des Articles</h3>
                  </Col>
                  <Col className="text-right">
                    <Button 
                      color="primary" 
                      onClick={openAddModal}
                      className="mr-2"
                    >
                      ➕ Ajouter un Article
                    </Button>
                    <Button 
                      color="info" 
                      size="sm" 
                      onClick={() => {
                        fetchArticles();
                        fetchEvenementsDisponibles();
                      }}
                    >
                      🔄 Actualiser
                    </Button>
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
                        placeholder="Rechercher par nom, description, type, événement..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col lg="6" className="text-right">
                    <div className="d-flex align-items-center justify-content-end">
                      <Badge color="primary" className="p-2 mr-3">
                        {filteredArticles.length} / {articles.length} résultats
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
                    <p className="mt-2">Chargement des articles...</p>
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
                            <span>📝 Nom</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('aNom') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aNom', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('aNom') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aNom', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📄 Description</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('aDescriptionArc') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aDescriptionArc', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('aDescriptionArc') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aDescriptionArc', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>🏷️ Type</span>
                            <ButtonGroup size="sm" className="ml-2">
                              <Button 
                                color={isColumnSorted('aTypePai') && sortConfig.direction === 'asc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aTypePai', 'asc')}
                                size="sm"
                              >
                                ↑
                              </Button>
                              <Button 
                                color={isColumnSorted('aTypePai') && sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                                onClick={() => handleSort('aTypePai', 'desc')}
                                size="sm"
                              >
                                ↓
                              </Button>
                            </ButtonGroup>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>🖼️ Image</span>
                          </div>
                        </th>
                        <th className="border-0">
                          <div className="d-flex align-items-center">
                            <span>📅 Événement lié</span>
                          </div>
                        </th>
                        <th className="border-0 text-center">⚙️ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="text-muted">
                              <i className="ni ni-single-copy-04 ni-3x mb-3"></i>
                              <br />
                              {articles.length === 0 ? 'Aucun article trouvé' : 'Aucun résultat pour votre recherche'}
                              <br />
                              <Button 
                                color="primary" 
                                size="sm" 
                                className="mt-2"
                                onClick={openAddModal}
                              >
                                ➕ Ajouter le premier article
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredArticles.map((article, index) => {
                          const evenementId = article.evenementLie?.value ? article.evenementLie.value.split('#')[1] : null;
                          const evenementTitre = article.evenementTitre?.value || 'Sans titre';
                          
                          return (
                            <tr key={index}>
                              <td className="border-0">
                                <Badge color="info" className="text-uppercase">
                                  {article.article?.value.split('#')[1] || 'N/A'}
                                </Badge>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">📝</span>
                                  <div>
                                    <strong>{article.aNom?.value || 'N/A'}</strong>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">📄</span>
                                  <div>
                                    {truncateText(article.aDescriptionArc?.value, 60)}
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">{getTypePaiIcon(article.aTypePai?.value)}</span>
                                  <div>
                                    <Badge color={getTypePaiColor(article.aTypePai?.value)} className="mr-2">
                                      {article.aTypePai?.value || 'N/A'}
                                    </Badge>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">🖼️</span>
                                  <div>
                                    {article.aImageArct?.value ? (
                                      <Badge color="success">Image disponible</Badge>
                                    ) : (
                                      <Badge color="secondary">Aucune image</Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <span className="mr-2">📅</span>
                                  <div>
                                    {evenementId ? (
                                      <div>
                                        <Badge color="info" className="mb-1">
                                          {evenementId}
                                        </Badge>
                                        <br />
                                        <small className="text-muted">
                                          {evenementTitre}
                                        </small>
                                      </div>
                                    ) : (
                                      <Badge color="secondary">Aucun événement</Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="border-0 text-center">
                                <Button 
                                  color="warning" 
                                  size="sm" 
                                  className="mr-1"
                                  onClick={() => openEditModal(article)}
                                  title="Modifier"
                                >
                                  <i className="ni ni-ruler-pencil"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm"
                                  onClick={() => handleDelete(article.article.value)}
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
            Ajouter un Nouvel Article
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="aNom">
                      <i className="ni ni-single-copy-04 mr-1"></i>
                      Nom de l'article *
                    </Label>
                    <Input
                      type="text"
                      name="aNom"
                      id="aNom"
                      placeholder="Ex: Article de conférence"
                      value={formData.aNom}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="aTypePai">
                      <i className="ni ni-tag mr-1"></i>
                      Type d'article *
                    </Label>
                    <Input
                      type="select"
                      name="aTypePai"
                      id="aTypePai"
                      value={formData.aTypePai}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="Premium">Premium</option>
                      <option value="Standard">Standard</option>
                      <option value="Basique">Basique</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <Label for="aDescriptionArc">
                      <i className="ni ni-align-left-2 mr-1"></i>
                      Description *
                    </Label>
                    <Input
                      type="textarea"
                      name="aDescriptionArc"
                      id="aDescriptionArc"
                      placeholder="Description détaillée de l'article..."
                      value={formData.aDescriptionArc}
                      onChange={handleChange}
                      rows="4"
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="aImageArct">
                      <i className="ni ni-image mr-1"></i>
                      URL de l'image
                    </Label>
                    <Input
                      type="text"
                      name="aImageArct"
                      id="aImageArct"
                      placeholder="Ex: https://example.com/image.jpg"
                      value={formData.aImageArct}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="evenementLie">
                      <i className="ni ni-calendar-grid-58 mr-1"></i>
                      Événement lié
                    </Label>
                    <Input
                      type="select"
                      name="evenementLie"
                      id="evenementLie"
                      value={formData.evenementLie}
                      onChange={handleChange}
                    >
                      <option value="">Aucun événement</option>
                      {evenementsDisponibles.map((evenement) => (
                        <option key={evenement.id} value={evenement.id}>
                          {evenement.titre} ({evenement.id})
                        </option>
                      ))}
                    </Input>
                    {evenementsDisponibles.length === 0 && (
                      <small className="text-muted">
                        Aucun événement disponible. Créez d'abord des événements.
                      </small>
                    )}
                  </FormGroup>
                </Col>
              </Row>
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-primary mb-2">
                  <i className="ni ni-notification-70 mr-1"></i>
                  Guide des types :
                </h6>
                <div className="d-flex flex-wrap gap-3 text-sm">
                  <span><Badge color="success">Premium</Badge> Contenu exclusif</span>
                  <span><Badge color="info">Standard</Badge> Contenu régulier</span>
                  <span><Badge color="secondary">Basique</Badge> Contenu basique</span>
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
                Ajouter l'Article
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* MODAL D'ÉDITION (manuel) */}
        <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)} size="lg">
          <ModalHeader toggle={() => setEditModal(!editModal)}>
            <i className="ni ni-ruler-pencil mr-2"></i>
            Modifier l'Article
          </ModalHeader>
          <Form onSubmit={handleUpdate}>
            <ModalBody>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-aNom">Nom de l'article</Label>
                    <Input
                      type="text"
                      name="aNom"
                      id="edit-aNom"
                      value={formData.aNom}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-aTypePai">Type d'article</Label>
                    <Input
                      type="select"
                      name="aTypePai"
                      id="edit-aTypePai"
                      value={formData.aTypePai}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="Premium">Premium</option>
                      <option value="Standard">Standard</option>
                      <option value="Basique">Basique</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <Label for="edit-aDescriptionArc">Description</Label>
                    <Input
                      type="textarea"
                      name="aDescriptionArc"
                      id="edit-aDescriptionArc"
                      value={formData.aDescriptionArc}
                      onChange={handleChange}
                      rows="4"
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-aImageArct">URL de l'image</Label>
                    <Input
                      type="text"
                      name="aImageArct"
                      id="edit-aImageArct"
                      value={formData.aImageArct}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-evenementLie">Événement lié</Label>
                    <Input
                      type="select"
                      name="evenementLie"
                      id="edit-evenementLie"
                      value={formData.evenementLie}
                      onChange={handleChange}
                    >
                      <option value="">Aucun événement</option>
                      {evenementsDisponibles.map((evenement) => (
                        <option key={evenement.id} value={evenement.id}>
                          {evenement.titre} ({evenement.id})
                        </option>
                      ))}
                    </Input>
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

export default ArticleForm;