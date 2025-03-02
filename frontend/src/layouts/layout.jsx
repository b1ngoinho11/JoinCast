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
      <div className="container-fluid" style={{display: 'flex', flexDirection: 'column', background: '#fff5ee', minHeight: '100vh' }}>
        {withSidebar && (
          <div style={{ display: 'flex', flex: 1,}}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div style={{ flex: 1, }}>
              <Outlet />
            </div>
          </div>
        )}
        {!withSidebar && (
          <div style={{ flex: 1, background: '#fff5ee'}}>
            <Outlet />
          </div>
        )}
      </div>
    </>
  );
};

export default Layout;