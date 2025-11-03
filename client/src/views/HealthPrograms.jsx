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
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Badge,
  Alert,
} from "reactstrap";
import Header from "components/Headers/Header.js";

const API_URL = "http://localhost:5000/api/health-programs";

const HealthPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Relations data
  const [users, setUsers] = useState([]);
  const [objectifs, setObjectifs] = useState([]);
  const [services, setServices] = useState([]);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [showRelations, setShowRelations] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    type: "Activity",
    name: "",
    description: "",
    duration: "",
    goals: "",
    assignedToUserId: "",
    scoreId: "",
    serviceId: "",
    etatSanteId: "",
    objectifId: ""
  });

  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    fetchPrograms();
    fetchRelationsData();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/all`);
      if (response.data.success) {
        setPrograms(response.data.programs);
      }
    } catch (err) {
      setError("Failed to fetch programs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationsData = async () => {
    try {
      const [usersRes, objectifsRes, servicesRes] = await Promise.all([
        axios.get(`${API_URL}/relations/users`),
        axios.get(`${API_URL}/relations/objectifs`),
        axios.get(`${API_URL}/relations/services`)
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (objectifsRes.data.success) setObjectifs(objectifsRes.data.objectifs);
      if (servicesRes.data.success) setServices(servicesRes.data.services);
    } catch (err) {
      console.error("Failed to fetch relations data:", err);
    }
  };

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
      goals: "",
      assignedToUserId: "",
      scoreId: "",
      serviceId: "",
      etatSanteId: "",
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
      goals: program.goals,
      assignedToUserId: program.relations?.assignedTo || "",
      scoreId: program.relations?.score || "",
      serviceId: program.relations?.service || "",
      etatSanteId: program.relations?.etatSante || "",
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
        await axios.put(`${API_URL}/${currentProgram.id}`, formData);
        setSuccess("Program updated successfully!");
      } else {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        await axios.post(`${API_URL}/create`, {
          ...formData,
          userId: user.username || "guest",
        });
        setSuccess("Program created successfully!");
      }
      
      setModalOpen(false);
      resetForm();
      fetchPrograms();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this program?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      setSuccess("Program deleted successfully!");
      fetchPrograms();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete program");
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
        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">{success}</Alert>}
        
        <Row>
          <div className="col">
            <Card className="shadow">
              <CardHeader className="border-0">
                <Row className="align-items-center">
                  <Col xs="8">
                    <h3 className="mb-0">Health Programs Management</h3>
                  </Col>
                  <Col className="text-right" xs="4">
                    <Button
                      color="primary"
                      onClick={openCreateModal}
                      size="sm"
                    >
                      <i className="ni ni-fat-add" /> Add Program
                    </Button>
                  </Col>
                </Row>
                
                <Row className="mt-3">
                  <Col>
                    <div className="btn-group" role="group">
                      <Button
                        color={filterType === "All" ? "primary" : "secondary"}
                        onClick={() => setFilterType("All")}
                        size="sm"
                      >
                        All
                      </Button>
                      <Button
                        color={filterType === "Activite" ? "primary" : "secondary"}
                        onClick={() => setFilterType("Activite")}
                        size="sm"
                      >
                        Activity
                      </Button>
                      <Button
                        color={filterType === "Sommeil" ? "info" : "secondary"}
                        onClick={() => setFilterType("Sommeil")}
                        size="sm"
                      >
                        Sleep
                      </Button>
                      <Button
                        color={filterType === "Nutrition" ? "success" : "secondary"}
                        onClick={() => setFilterType("Nutrition")}
                        size="sm"
                      >
                        Nutrition
                      </Button>
                    </div>
                  </Col>
                </Row>
              </CardHeader>
              
              <CardBody>
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Table className="align-items-center table-flush" responsive>
                    <thead className="thead-light">
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Type</th>
                        <th scope="col">Description</th>
                        <th scope="col">Duration</th>
                        <th scope="col">Relations</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrograms.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No programs found
                          </td>
                        </tr>
                      ) : (
                        filteredPrograms.map((program) => (
                          <tr key={program.id}>
                            <td>
                              <strong>{program.name}</strong>
                            </td>
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
                                {program.relations?.service && (
                                  <Badge color="success">
                                    🏥 {program.relations.service}
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
                )}
              </CardBody>
            </Card>
          </div>
        </Row>

        {/* Modal Create/Edit */}
        <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
          <ModalHeader toggle={() => setModalOpen(false)}>
            {editMode ? "Edit Program" : "Create New Program"}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <FormGroup>
                <Label for="type">Program Type *</Label>
                <Input
                  type="select"
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  disabled={editMode}
                >
                  <option value="Activity">Activity</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Nutrition">Nutrition</option>
                </Input>
              </FormGroup>

              <FormGroup>
                <Label for="name">Program Name *</Label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter program name"
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
                  placeholder="Enter program description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </FormGroup>

              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="duration">Duration</Label>
                    <Input
                      type="text"
                      name="duration"
                      id="duration"
                      placeholder="e.g., 4 weeks"
                      value={formData.duration}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="goals">Goals</Label>
                    <Input
                      type="text"
                      name="goals"
                      id="goals"
                      placeholder="Enter goals"
                      value={formData.goals}
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
                  {showRelations ? "▼" : "▶"} Relations (Optional)
                </Button>
              </h5>

              {showRelations && (
                <>
                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="assignedToUserId">Assigned To User</Label>
                        <Input
                          type="select"
                          name="assignedToUserId"
                          id="assignedToUserId"
                          value={formData.assignedToUserId}
                          onChange={handleInputChange}
                        >
                          <option value="">-- Select User --</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.username} ({user.email})
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
                          <option value="">-- Select Objectif --</option>
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
                        <Label for="serviceId">Medical Service</Label>
                        <Input
                          type="select"
                          name="serviceId"
                          id="serviceId"
                          value={formData.serviceId}
                          onChange={handleInputChange}
                        >
                          <option value="">-- Select Service --</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>
                              {service.name} ({service.type})
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label for="etatSanteId">État Santé ID</Label>
                        <Input
                          type="text"
                          name="etatSanteId"
                          id="etatSanteId"
                          placeholder="e.g., etat_1"
                          value={formData.etatSanteId}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <FormGroup>
                    <Label for="scoreId">Score Santé ID</Label>
                    <Input
                      type="text"
                      name="scoreId"
                      id="scoreId"
                      placeholder="e.g., score_1"
                      value={formData.scoreId}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                {editMode ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

export default HealthPrograms;