import React, { useState } from "react";
import { Container, Row, Col } from "reactstrap";
import Header from "components/Headers/Header.js";
import ServiceForm from "components/ServiceForm.jsx";
import ServicesList from "components/ServicesList.jsx";

const Services = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleServiceSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        <Row className="mt-4">
          <Col lg="4" md="12">
            <ServiceForm onSaved={handleServiceSaved} />
          </Col>
          <Col lg="8" md="12">
            <ServicesList key={refreshKey} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Services;
