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
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    type: "Activity",
    name: "",
    description: "",
    duration: "",
    goals: "",
  });

  // Filter state
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    fetchPrograms();
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
    });
    setEditMode(false);
    setCurrentProgram(null);
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
        // Update
        await axios.put(`${API_URL}/${currentProgram.id}`, formData);
        setSuccess("Program updated successfully!");
      } else {
        // Create
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
                        <th scope="col">Goals</th>
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
                            <td>{program.goals || "-"}</td>
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

              <FormGroup>
                <Label for="duration">Duration</Label>
                <Input
                  type="text"
                  name="duration"
                  id="duration"
                  placeholder="e.g., 4 weeks, 30 days"
                  value={formData.duration}
                  onChange={handleInputChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="goals">Goals</Label>
                <Input
                  type="textarea"
                  name="goals"
                  id="goals"
                  placeholder="Enter program goals"
                  value={formData.goals}
                  onChange={handleInputChange}
                  rows="2"
                />
              </FormGroup>
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