// src/Dashboard.js
import ShowList from '@/components/showList';
import CreateShow from '@/components/createShow';
// import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const DashboardPage = () => {

  return (
    <Container fluid>
      <Row className="p-3">
        <Col md={5}>
          <CreateShow />
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;