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
  // const [searchQuery, setSearchQuery] = React.useState("");
  const { isLoggedIn, logout, user } = React.useContext(AuthContext);

  // API base URL for profile images - should match your backend
  const API_URL = "http://localhost:8000/api/v1";

  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   alert(`Searching for ${searchQuery}`);
  // };

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
  
  CustomToggle.displayName = 'CustomToggle';

  // Function to get the user's profile picture URL
  const getProfilePictureUrl = () => {
    if (user && user.profile_picture) {
      return `${API_URL}/users/profile-picture/${user.profile_picture}`;
    }
    // Return a default avatar if no profile picture is set
    return "https://via.placeholder.com/40?text=User";
  };

  return (
    <Navbar
      expand="lg"
      style={{
        height: "80px",
        padding: "0",
        borderBottom: "1px solid #e0e0e0",
        background: "#fff5ee",
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
            <Nav.Link href="/list-shows" className="px-2">
              Shows
            </Nav.Link>
            <Nav.Link href="/" className="px-2">
              Explore
            </Nav.Link>
          </Nav>
        </div>

        {/* Middle Section */}
        {/* <Form className="d-flex mx-4" style={{ maxWidth: "500px", flex: 1 }}>
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
        </Form> */}

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
                    src={getProfilePictureUrl()}
                    className="rounded-circle avatar"
                    alt="Avatar"
                  />
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-sm">
                  <Dropdown.Item href="/myaccount" className="py-2">
                    Account
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item href="/shows" className="py-2">
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
            <Button variant="primary" href="/login" className="ms-2">
              Sign In
            </Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default NavbarDefault;
