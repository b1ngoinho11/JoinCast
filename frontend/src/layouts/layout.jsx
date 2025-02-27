import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import NavbarDefault from "../components/NavBar";
import Sidebar from "../components/SideBar";

// Combined Layout component
const Layout = ({ withSidebar }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <NavbarDefault />
      {withSidebar ? (
        <div className="container-fluid" style={{ height: '100vh', display: 'flex' }}>
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default Layout;
