import React from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "../css/sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation(); // Get current location

  return (
    <div 
      className="customSidebar" 
      style={{ 
        width: isOpen ? "250px" : "50px", 
        position: "relative" 
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
        }}
      >
        {isOpen ? "<" : ">"}
      </button>

      <Nav className="flex-column" style={{ height: "100vh", paddingTop: "50px" }}>
        <Nav.Link
          as={Link}
          to="/myaccount"
          className={`sidebarLink ${location.pathname === "/myaccount" ? "active" : ""}`}
        >
          {isOpen ? "Account" : ""}
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
          to="/upload"
          className={`sidebarLink ${location.pathname === "/upload" ? "active" : ""}`}
        >
          {isOpen ? "Upload" : ""}
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/live-session"
          className={`sidebarLink ${location.pathname === "/live-session" ? "active" : ""}`}
        >
          {isOpen ? "Live Session" : ""}
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;