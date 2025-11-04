import React from "react";
import { Container, Row, Col } from "reactstrap";
import Header from "components/Headers/Header.js";
import PaymentsPage from "components/PaymentsPage.jsx";

const Payments = () => {
  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        <Row className="mt-4">
          <Col xl="12">
            <PaymentsPage />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Payments;
