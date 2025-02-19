// src/components/Layout.js
import { Outlet } from 'react-router-dom';
import NavbarDefault from '../components/NavBar';

const Layout = () => {
  return (
    <>
      <NavbarDefault />
      <Outlet />
    </>
  );
};

export default Layout;