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
} from "reactstrap";
import { toast } from "react-toastify";
import UserHeader from "components/Headers/UserHeader.js";

const toInputDateTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const toXsdDateTime = (localValue) => {
  if (!localValue) return "";
  const date = new Date(localValue);
  return date.toISOString();
};

const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

const mapBindingsToObjectifs = (bindings = []) =>
  bindings
    .map((binding) => {
      const id = binding.objectif?.value?.replace(PREFIX, "") || "";
      return {
        id,
        classeRdf:
          binding.classe?.value?.replace(PREFIX, "") || "ObjectifQualitatif",
        type: binding.type?.value || "",
        description: binding.description?.value || "",
        dateDebut: binding.dateDebut?.value || null,
        dateFin: binding.dateFin?.value || null,
        etat: binding.etat?.value || "En cours",
      };
    })
    .filter((objectif) => objectif.id);

const initialForm = {
  type: "",
  description: "",
  dateDebut: "",
  dateFin: "",
  etat: "En cours",
  classeRdf: "ObjectifQualitatif",
};

const Objectif = () => {
  const [formData, setFormData] = useState({ ...initialForm });
  const [objectifs, setObjectifs] = useState([]);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sortOption, setSortOption] = useState("dateDebut-desc");

  const API_URL = "http://localhost:5000/api/objectifs";

  const fetchObjectifs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL);
      const mapped = mapBindingsToObjectifs(data);
      const unique = mapped.filter(
        (item, index, arr) =>
          index === arr.findIndex((candidate) => candidate.id === item.id)
      );
      setObjectifs(unique);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement des objectifs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectifs();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const { type, description, dateDebut, dateFin } = formData;
    if (!type.trim()) return "Le type d'objectif est requis.";
    if (!description.trim()) return "La description est requise.";
    if (description.trim().length < 10)
      return "La description doit contenir au moins 10 caractères.";
    if (!dateDebut) return "La date de début est requise.";
    if (!dateFin) return "La date de fin est requise.";
    if (new Date(dateFin) < new Date(dateDebut))
      return "La date de fin doit être postérieure à la date de début.";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errorMessage = validate();
    if (errorMessage) {
      toast.warning(errorMessage);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        dateDebut: toXsdDateTime(formData.dateDebut),
        dateFin: toXsdDateTime(formData.dateFin),
      };

      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
        toast.success("Objectif mis à jour.");
      } else {
        await axios.post(API_URL, payload);
        toast.success("Objectif ajouté.");
      }

      resetForm();
      await fetchObjectifs();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.errors?.[0] ||
        error.response?.data?.error ||
        "Erreur lors de l'enregistrement.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...initialForm });
    setEditId(null);
  };

  const handleEdit = (objectif) => {
    if (!objectif?.id) {
      toast.error("Impossible d'éditer cet objectif.");
      return;
    }

    setEditId(objectif.id);
    setFormData({
      type: objectif.type,
      description: objectif.description,
      dateDebut: toInputDateTime(objectif.dateDebut),
      dateFin: toInputDateTime(objectif.dateFin),
      etat: objectif.etat,
      classeRdf: objectif.classeRdf,
    });
    toast.info("Mode édition activé.");
  };

  const handleDelete = async (id) => {
    if (!id) {
      toast.error("Identifiant manquant.");
      return;
    }
    if (!window.confirm("Supprimer cet objectif ?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Objectif supprimé.");
      if (editId === id) {
        resetForm();
      }
      fetchObjectifs();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  const labelClasse = (classeRdf) => {
    const short = (classeRdf || "").replace(PREFIX, "");
    switch (short) {
      case "ObjectifQuantitatif":
        return "Quantitatif";
      case "ObjectifQualitatif":
        return "Qualitatif";
      default:
        return short || "-";
    }
  };

  const filteredObjectifs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = objectifs.filter((objectif) => {
      const matchesSearch = normalizedSearch
        ? [
            objectif.type,
            objectif.description,
            objectif.etat,
            labelClasse(objectif.classeRdf),
            objectif.dateDebut
              ? new Date(objectif.dateDebut).toLocaleString()
              : "",
            objectif.dateFin ? new Date(objectif.dateFin).toLocaleString() : "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      const matchesStatus =
        statusFilter === "all" ||
        objectif.etat.toLowerCase() === statusFilter.toLowerCase();

      const matchesClass =
        classFilter === "all" ||
        objectif.classeRdf.toLowerCase() === classFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesClass;
    });

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const [key, order] = sortOption.split("-");
      let valueA = a[key];
      let valueB = b[key];

      if (key === "dateDebut" || key === "dateFin") {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      } else {
        valueA = (valueA || "").toString().toLowerCase();
        valueB = (valueB || "").toString().toLowerCase();
      }

      if (valueA < valueB) return order === "asc" ? -1 : 1;
      if (valueA > valueB) return order === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [objectifs, searchTerm, statusFilter, classFilter, sortOption]);

  return (
    <>
      <UserHeader />
      <Container className="mt--7" fluid>
        <Row>
          <Col xl="7">
            <Card className="shadow">
              <CardHeader className="border-0 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                <h3 className="mb-0">Liste des objectifs</h3>
                <div className="d-flex flex-column flex-lg-row gap-2 w-100 w-lg-auto">
                  <Input
                    placeholder="Recherche"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <Input
                    type="select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </Input>
                  <Input
                    type="select"
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="ObjectifQualitatif">Qualitatif</option>
                    <option value="ObjectifQuantitatif">Quantitatif</option>
                  </Input>
                  <Input
                    type="select"
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value)}
                  >
                    <option value="dateDebut-desc">Début (récent → ancien)</option>
                    <option value="dateDebut-asc">Début (ancien → récent)</option>
                    <option value="dateFin-desc">Fin (récent → ancien)</option>
                    <option value="dateFin-asc">Fin (ancien → récent)</option>
                    <option value="type-asc">Type (A → Z)</option>
                    <option value="type-desc">Type (Z → A)</option>
                  </Input>
                </div>
              </CardHeader>
              <CardBody>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th>Catégorie</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Début</th>
                      <th>Fin</th>
                      <th>État</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Chargement...
                        </td>
                      </tr>
                    ) : filteredObjectifs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Aucun objectif
                        </td>
                      </tr>
                    ) : (
                      filteredObjectifs.map((objectif) => (
                        <tr key={objectif.id}>
                          <td>{labelClasse(objectif.classeRdf)}</td>
                          <td>{objectif.type}</td>
                          <td>{objectif.description}</td>
                          <td>
                            {objectif.dateDebut
                              ? new Date(objectif.dateDebut).toLocaleString()
                              : ""}
                          </td>
                          <td>
                            {objectif.dateFin
                              ? new Date(objectif.dateFin).toLocaleString()
                              : ""}
                          </td>
                          <td>{objectif.etat}</td>
                          <td>
                            <Button
                              color="info"
                              size="sm"
                              onClick={() => handleEdit(objectif)}
                            >
                              Éditer
                            </Button>{" "}
                            <Button
                              color="danger"
                              size="sm"
                              onClick={() => handleDelete(objectif.id)}
                            >
                              Supprimer
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
          <Col className="order-xl-1" xl="5">
            <Card className="bg-secondary shadow">
              <CardHeader className="bg-white border-0">
                <h3 className="mb-0">
                  {editId ? "Modifier un objectif" : "Ajouter un objectif"}
                </h3>
              </CardHeader>
              <CardBody>
                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <label className="form-control-label">
                      Type d&apos;objectif
                    </label>
                    <Input
                      type="select"
                      name="classeRdf"
                      className="form-control-alternative"
                      value={formData.classeRdf}
                      onChange={handleChange}
                    >
                      <option value="ObjectifQualitatif">
                        Objectif qualitatif
                      </option>
                      <option value="ObjectifQuantitatif">
                        Objectif quantitatif
                      </option>
                    </Input>
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Type</label>
                    <Input
                      className="form-control-alternative"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      placeholder="Ex : Perte de poids"
                      type="text"
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Description</label>
                    <Input
                      className="form-control-alternative"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Détails de l'objectif..."
                      type="textarea"
                      rows="3"
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Date de début</label>
                    <Input
                      className="form-control-alternative"
                      name="dateDebut"
                      type="datetime-local"
                      value={formData.dateDebut}
                      onChange={handleChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">Date de fin</label>
                    <Input
                      className="form-control-alternative"
                      name="dateFin"
                      type="datetime-local"
                      value={formData.dateFin}
                      onChange={handleChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label className="form-control-label">État</label>
                    <Input
                      type="select"
                      name="etat"
                      className="form-control-alternative"
                      value={formData.etat}
                      onChange={handleChange}
                    >
                      <option>En cours</option>
                      <option>Terminé</option>
                    </Input>
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

export default Objectif;
