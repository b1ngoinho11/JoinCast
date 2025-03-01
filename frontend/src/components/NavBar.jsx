import React from "react";
import {
  Navbar,
  Nav,
  Form,
  FormControl,
  Button,
  Container,
  Dropdown,
} from "react-bootstrap";
import { BsSearch, BsBell } from "react-icons/bs";
import logo from "../assets/logo.png";
import "../css/NavBar.css";
import { AuthContext } from "../contexts/authContext";

function NavbarDefault() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { isLoggedIn, logout } = React.useContext(AuthContext);

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for ${searchQuery}`);
  };

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a
      href="#profile"
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      style={{
        cursor: "pointer",
        padding: 0,
        background: "none",
        border: "none",
      }}
    >
      {children}
    </a>
  ));

  return (
    <Navbar
      expand="lg"
      style={{
        height: "80px",
        padding: "0.5rem 0",
        boxShadow: "0 2px 0 0 rgba(0,0,0,0.1)",
      }}
    >
      <Container style={{ marginTop: "10px", maxWidth: "92%" }} fluid>
        {/* Left Section */}
        <div className="d-flex align-items-center" style={{ maxWidth: "250px" }}>
          <Navbar.Brand href="/" className="me-3">
            <img
              src={logo}
              className="d-inline-block align-top logo"
              alt="Logo"
            />
          </Navbar.Brand>
          <Nav className="align-items-center">
            <Nav.Link href="/following" className="px-2">
              Following
            </Nav.Link>
            <Nav.Link href="/" className="px-2">
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
          {isLoggedIn ? (
            <>
              <Nav.Link href="#notifications" className="me-3">
                <BsBell size={20} />
              </Nav.Link>

              <Dropdown align="end">
                <Dropdown.Toggle as={CustomToggle}>
                  <img
                    src="https://static1.srcdn.com/wordpress/wp-content/uploads/2024/04/img_0313.jpeg"
                    className="rounded-circle avatar"
                    alt="Avatar"
                  />
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-sm">
                  <Dropdown.Item href="/myaccount" className="py-2">
                    Account
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item href="/dashboard" className="py-2">
                    Studio
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={logout} className="py-2 text-danger" href="/">
                    Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </>
          ) : (
            <Button variant="outline-primary" href="/login" className="ms-2">
              Sign In
            </Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default NavbarDefault;
