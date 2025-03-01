// src/Dashboard.js
import React from 'react';
import { Container, Row, Col, Navbar, Nav, Card } from 'react-bootstrap';

const DashboardPage = () => {
  return (
    <Container fluid>
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#home">YouTube Dashboard</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="#home">Home</Nav.Link>
          <Nav.Link href="#trending">Trending</Nav.Link>
          <Nav.Link href="#subscriptions">Subscriptions</Nav.Link>
        </Nav>
      </Navbar>

      <Row>
        <Col md={2} className="bg-light sidebar">
          <h5 className="p-3">Categories</h5>
          <Nav className="flex-column">
            <Nav.Link href="#music">Music</Nav.Link>
            <Nav.Link href="#gaming">Gaming</Nav.Link>
            <Nav.Link href="#news">News</Nav.Link>
            <Nav.Link href="#sports">Sports</Nav.Link>
          </Nav>
        </Col>

        <Col md={10}>
          <Row className="p-3">
            <Col md={4}>
              <Card>
                <Card.Img variant="top" src="https://via.placeholder.com/150" />
                <Card.Body>
                  <Card.Title>Video Title 1</Card.Title>
                  <Card.Text>
                    Description of video 1.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Img variant="top" src="https://via.placeholder.com/150" />
                <Card.Body>
                  <Card.Title>Video Title 2</Card.Title>
                  <Card.Text>
                    Description of video 2.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Img variant="top" src="https://via.placeholder.com/150" />
                <Card.Body>
                  <Card.Title>Video Title 3</Card.Title>
                  <Card.Text>
                    Description of video 3.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;