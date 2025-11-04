import React from "react";
import { Container, Row, Col } from "reactstrap";
import Header from "components/Headers/Header.js";
import MedicalAssistantChat from "components/MedicalAssistantChat.jsx";

const MedicalAssistant = () => {
  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        <Row className="mt-4">
          <Col xl="12">
            <MedicalAssistantChat />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default MedicalAssistant;
