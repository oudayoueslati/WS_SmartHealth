import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  Container,
  Row,
  Col,
  Table,
  Spinner,
} from "reactstrap";
import { toast } from "react-toastify";
import UserHeader from "components/Headers/UserHeader.js";
import AIBox from "components/AIBOX";

const API_URL = "http://localhost:5000/api/etat-sante";
const CATEGORY_OPTIONS = [
  { value: "Allergie", label: "Allergie" },
  { value: "ConditionMedicale", label: "Condition médicale" },
  { value: "TraitementMedicale", label: "Traitement médical" },
];

const INITIAL_FORM = {
  classeRdf: "ConditionMedicale",
  poids: "",
  taille: "",
  pression: "",
  temperature: "",
  date: "",
};

const poidsBounds = { min: 0, max: 500 };
const tailleBounds = { min: 0, max: 3 };
const temperatureBounds = { min: 30, max: 45 };

const toInputDateTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const toIsoString = (localValue) => {
  if (!localValue) return "";
  return new Date(localValue).toISOString();
};

const validateForm = (formData) => {
  const errors = [];
  const poids = Number.parseFloat(formData.poids);
  const taille = Number.parseFloat(formData.taille);
  const temperature = Number.parseFloat(formData.temperature);
  const pression = (formData.pression || "").trim();
  const hasDate = formData.date && !Number.isNaN(new Date(formData.date).getTime());

  if (!CATEGORY_OPTIONS.some((option) => option.value === formData.classeRdf)) {
    errors.push("La catégorie sélectionnée est invalide.");
  }

  if (!Number.isFinite(poids) || poids <= poidsBounds.min || poids > poidsBounds.max) {
    errors.push("Le poids doit être compris entre 0 et 500 kg.");
  }

  if (!Number.isFinite(taille) || taille <= tailleBounds.min || taille > tailleBounds.max) {
    errors.push("La taille doit être comprise entre 0 m et 3 m.");
  }

  if (!/^\d{2,3}\/\d{2,3}$/.test(pression)) {
    errors.push("La pression doit respecter le format 120/80.");
  }

  if (
    !Number.isFinite(temperature) ||
    temperature < temperatureBounds.min ||
    temperature > temperatureBounds.max
  ) {
    errors.push("La température doit être comprise entre 30°C et 45°C.");
  }

  if (!hasDate) {
    errors.push("La date est obligatoire.");
  }

  return errors;
};

const EtatSante = () => {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [etatList, setEtatList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOption, setSortOption] = useState("date-desc");

  const fetchEtats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL);
      if (!Array.isArray(data)) {
        throw new Error("Réponse inattendue du serveur.");
      }

      const unique = data.filter(
        (item, index, arr) =>
          item.id && index === arr.findIndex((candidate) => candidate.id === item.id)
      );

      setEtatList(unique);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de récupérer les états de santé.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtats();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM });
    setEditId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateForm(formData);
    if (errors.length > 0) {
      toast.warning(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        classeRdf: formData.classeRdf,
        poids: Number.parseFloat(formData.poids),
        taille: Number.parseFloat(formData.taille),
        pression: formData.pression.trim(),
        temperature: Number.parseFloat(formData.temperature),
        date: toIsoString(formData.date),
      };

      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
        toast.success("État de santé mis à jour.");
      } else {
        await axios.post(API_URL, payload);
        toast.success("État de santé ajouté.");
      }

      resetForm();
      await fetchEtats();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.errors?.[0] ||
        error.response?.data?.error ||
        "Une erreur est survenue lors de l'enregistrement.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (etat) => {
    if (!etat?.id) {
      toast.error("Impossible d'éditer cet état.");
      return;
    }

    setEditId(etat.id);
    setFormData({
      classeRdf: etat.classe || "ConditionMedicale",
      poids: etat.poids?.toString() ?? "",
      taille: etat.taille?.toString() ?? "",
      pression: etat.pression ?? "",
      temperature: etat.temperature?.toString() ?? "",
      date: toInputDateTime(etat.date),
    });
    toast.info("Mode édition activé.");
  };

  const handleDelete = async (id) => {
    if (!id) {
      toast.error("Identifiant introuvable.");
      return;
    }
    if (!window.confirm("Supprimer cet état de santé ?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("État supprimé.");
      if (editId === id) {
        resetForm();
      }
      await fetchEtats();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  const categoryLabel = (value) =>
    CATEGORY_OPTIONS.find((option) => option.value === value)?.label ||
    value ||
    "-";

  const filteredEtats = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = etatList.filter((etat) => {
      const matchesSearch = normalizedSearch
        ? [
            etat.classe,
            etat.poids,
            etat.taille,
            etat.pression,
            etat.temperature,
            etat.date ? new Date(etat.date).toLocaleString() : "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      const matchesCategory =
        categoryFilter === "all" ||
        (etat.classe || "ConditionMedicale") === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const [key, order] = sortOption.split("-");
      let valueA = a[key];
      let valueB = b[key];

      if (key === "date") {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      } else if (key === "pression") {
        const parsePression = (value) => {
          const [systolic = 0, diastolic = 0] = (value || "")
            .split("/")
            .map((number) => Number.parseInt(number, 10) || 0);
          return systolic * 1000 + diastolic;
        };
        valueA = parsePression(a.pression);
        valueB = parsePression(b.pression);
      } else {
        valueA = Number.isFinite(valueA) ? valueA : Number(valueA) || 0;
        valueB = Number.isFinite(valueB) ? valueB : Number(valueB) || 0;
      }

      if (valueA < valueB) return order === "asc" ? -1 : 1;
      if (valueA > valueB) return order === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [etatList, searchTerm, categoryFilter, sortOption]);

  return (
    <>
      <UserHeader />
       
      <Container className="mt--7" fluid>
        <Row>
          <Col md="12">
            {/* ✅ Assistant AI intégré */}
            <AIBox entity="etat_sante" />
          </Col>
        </Row>
        <Row>
          <Col xl="7">
            <Card className="shadow">
              <CardHeader className="border-0 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                <h3 className="mb-0">Liste des états de santé</h3>
                <div className="d-flex flex-column flex-lg-row gap-2 w-100 w-lg-auto">
                  <Input
                    placeholder="Recherche dynamique"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <Input
                    type="select"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="all">Toutes les catégories</option>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Input>
                  <Input
                    type="select"
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value)}
                  >
                    <option value="date-desc">Date (récent → ancien)</option>
                    <option value="date-asc">Date (ancien → récent)</option>
                    <option value="poids-desc">Poids décroissant</option>
                    <option value="poids-asc">Poids croissant</option>
                    <option value="temperature-desc">
                      Température décroissante
                    </option>
                    <option value="temperature-asc">
                      Température croissante
                    </option>
                    <option value="pression-desc">Pression décroissante</option>
                    <option value="pression-asc">Pression croissante</option>
                  </Input>
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner color="primary" />
                  </div>
                ) : (
                  <Table className="align-items-center table-flush" responsive>
                    <thead className="thead-light">
                      <tr>
                        <th>Catégorie</th>
                        <th>Poids (kg)</th>
                        <th>Taille (m)</th>
                        <th>Pression</th>
                        <th>Température (°C)</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEtats.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center">
                            Aucun enregistrement
                          </td>
                        </tr>
                      ) : (
                        filteredEtats.map((etat) => (
                          <tr key={etat.id}>
                            <td>{categoryLabel(etat.classe)}</td>
                            <td>{etat.poids}</td>
                            <td>{etat.taille}</td>
                            <td>{etat.pression}</td>
                            <td>{etat.temperature}</td>
                            <td>
                              {etat.date
                                ? new Date(etat.date).toLocaleString()
                                : ""}
                            </td>
                            <td>
                              <Button
                                color="info"
                                size="sm"
                                onClick={() => handleEdit(etat)}
                              >
                                Éditer
                              </Button>{" "}
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleDelete(etat.id)}
                              >
                                Supprimer
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col className="order-xl-1" xl="5">
            <Card className="bg-secondary shadow">
              <CardHeader className="bg-white border-0">
                <h3 className="mb-0">
                  {editId ? "Modifier un état" : "Ajouter un état de santé"}
                </h3>
              </CardHeader>
              <CardBody>
                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <label className="form-control-label">
                      Catégorie d&apos;état
                    </label>
                    <Input
                      type="select"
                      name="classeRdf"
                      className="form-control-alternative"
                      value={formData.classeRdf}
                      onChange={handleChange}
                      required
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Poids (kg)</label>
                    <Input
                      className="form-control-alternative"
                      name="poids"
                      type="number"
                      step="0.1"
                      value={formData.poids}
                      onChange={handleChange}
                      placeholder="Ex : 75"
                      min={poidsBounds.min}
                      max={poidsBounds.max}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Taille (m)</label>
                    <Input
                      className="form-control-alternative"
                      name="taille"
                      type="number"
                      step="0.01"
                      value={formData.taille}
                      onChange={handleChange}
                      placeholder="Ex : 1.80"
                      min={tailleBounds.min}
                      max={tailleBounds.max}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Pression</label>
                    <Input
                      className="form-control-alternative"
                      name="pression"
                      type="text"
                      value={formData.pression}
                      onChange={handleChange}
                      placeholder="Ex : 120/80"
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">
                      Température (°C)
                    </label>
                    <Input
                      className="form-control-alternative"
                      name="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="Ex : 37.1"
                      min={temperatureBounds.min}
                      max={temperatureBounds.max}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Date</label>
                    <Input
                      className="form-control-alternative"
                      name="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                  <Button color="primary" type="submit" disabled={submitting}>
                    {submitting
                      ? "En cours..."
                      : editId
                      ? "Mettre à jour"
                      : "Ajouter"}
                  </Button>{" "}
                  {editId && (
                    <Button
                      color="secondary"
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Annuler
                    </Button>
                  )}
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default EtatSante;
