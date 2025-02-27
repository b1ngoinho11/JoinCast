import React, { useState } from "react";
import Sidebar from "../components/SideBar"; // Ensure the correct import path

const AccountPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="container-fluid" style={{ height: '100vh', display: 'flex' }}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div style={{ flex: 1, padding: '20px' }}>
                <h1>Account Page</h1>
                {/* You can add more content here, like the account modification form */}
            </div>
        </div>
    );
}

export default AccountPage;