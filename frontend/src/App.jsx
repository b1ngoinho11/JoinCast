import "./css/App.css";
import NavbarDefault from "./components/NavBar";
import 'bootstrap/dist/css/bootstrap.min.css';
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
