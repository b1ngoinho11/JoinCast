import React from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "../css/sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation(); // Get current location

  return (
    <div style={{ position: "relative" }}>
      {/* Overlay when sidebar is closed */}
      {!isOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            zIndex: 1,
          }}
        />
      )}

      <div
        className="customSidebar"
        style={{
          width: isOpen ? "250px" : "50px",
          transition: "width 0.3s", // Smooth transition for width change
          borderRight: isOpen ?'solid 1px #d9d0ca' : 'none',
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            position: "absolute",
            top: "10px",
            left: isOpen ? "210px" : "10px",
            backgroundColor: "#4f4f52",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            padding: "5px 10px",
            transition: "left 0.3s",
            zIndex: 2, // Ensure button is above the overlay
          }}
        >
          {isOpen ? "<" : ">"}
        </button>

        <Nav className="flex-column" style={{ height: "100vh", paddingTop: "50px" }}>
          <Nav.Link
            as={Link}
            to="/dashboard"
            className={`sidebarLink ${location.pathname === "/dashboard" ? "active" : ""}`}
          >
            {isOpen ? "Dashboard" : ""}
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/analytics"
            className={`sidebarLink ${location.pathname === "/analytics" ? "active" : ""}`}
          >
            {isOpen ? "Analytics" : ""}
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/content"
            className={`sidebarLink ${location.pathname === "/content" ? "active" : ""}`}
          >
            {isOpen ? "Content" : ""}
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/subtitle"
            className={`sidebarLink ${location.pathname === "/subtitle" ? "active" : ""}`}
          >
            {isOpen ? "Subtitle" : ""}
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;