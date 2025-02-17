import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { BsSearch } from "react-icons/bs";
import "../css/Navbar.css";
import { Col } from "react-bootstrap";

function NavbarDefault() {
    function handleSearch(e) {
        e.preventDefault();
        alert("Search button clicked");
      }

  return (
      <Navbar expand="xl" className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand href="#">JoinCast</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Col>
              <Nav
                className="me-auto my-2 my-lg-0"
                style={{ maxHeight: "100px" }}
                navbarScroll
              >
                <Nav.Link href="#action1">Following</Nav.Link>
                <Nav.Link href="#action2">Explore</Nav.Link>
              </Nav>
            </Col>
            <Col>
              <Form className="d-flex search-form" > 
                <Form.Control
                  type="search"
                  placeholder="Search"
                  className="me-2"
                  aria-label="Search"
                />
                <Button variant="link" onClick={handleSearch}>
                  <BsSearch />
                </Button>
              </Form>
            </Col>
            <Col className="d-flex justify-content-end align-items-center">
              <img
                src="path/to/avatar.jpg"
                alt="User Avatar"
                className="avatar"
              />
            </Col>
          </Navbar.Collapse>
        </Container>
      </Navbar>
  );
}

export default NavbarDefault;
