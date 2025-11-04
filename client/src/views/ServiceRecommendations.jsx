import React, { useState } from "react";
import { Container, Row, Col } from "reactstrap";
import Header from "components/Headers/Header.js";
import SmartServiceSearch from "components/SmartServiceSearch.jsx";

const ServiceRecommendations = () => {
  const [selectedService, setSelectedService] = useState(null);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    alert(`✅ Service sélectionné: ${service.label || service.id}\n\nVous pouvez maintenant créer un paiement pour ce service.`);
  };

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        <Row className="mt-4">
          <Col xl="12">
            <SmartServiceSearch onServiceSelect={handleServiceSelect} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ServiceRecommendations;
