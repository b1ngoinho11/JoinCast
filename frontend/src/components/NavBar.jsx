import React from "react";
import {
  Navbar,
  Nav,
  Form,
  FormControl,
  Button,
  Container,
} from "react-bootstrap";
import { BsSearch, BsBell } from "react-icons/bs";
import logo from "../assets/logo.png";
import "../css/NavBar.css";

function NavbarDefault() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for ${searchQuery}`);
  };

  return (
    <Navbar
      bg="light"
      expand="lg"
      style={{
        height: "60px",
        padding: "0.5rem 0",
      }}
    >
      <Container>
        {/* Left Section */}
        <div className="d-flex align-items-center" style={{ width: "250px" }}>
          <Navbar.Brand href="#" className="me-3">
            <img
              src={logo}
              className="d-inline-block align-top logo"
              alt="Logo"
            />
          </Navbar.Brand>
          <Nav className="align-items-center">
            <Nav.Link href="#following" className="px-2">
              Following
            </Nav.Link>
            <Nav.Link href="#explore" className="px-2">
              Explore
            </Nav.Link>
          </Nav>
        </div>

        {/* Middle Section */}
        <Form className="d-flex mx-4" style={{ maxWidth: "500px", flex: 1 }}>
          <FormControl
            type="search"
            placeholder="Search"
            className="me-2"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
          variant="link" 
          style={{ minWidth: "40px" }}
          type="submit"
          onClick={handleSearch}
          >
            <BsSearch size={20} color="345766" />
          </Button>
        </Form>

        {/* Right Section */}
        <div
          className="d-flex align-items-center"
          style={{ width: "250px", justifyContent: "flex-end" }}
        >
          <Nav.Link href="#notifications" className="me-3">
            <BsBell size={20} />
          </Nav.Link>
          <Nav.Link href="#profile">
            <img
              src="https://static.wikia.nocookie.net/attack-vampire/images/1/18/Eren_Jaeger.png/revision/latest/scale-to-width-down/215?cb=20190722000208"
              className="rounded-circle avatar"
              alt="Avatar"
            />
          </Nav.Link>
        </div>
      </Container>
    </Navbar>
  );
}

export default NavbarDefault;
