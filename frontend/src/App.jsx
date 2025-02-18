import "./css/App.css";
import NavbarDefault from "./components/NavBar";
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from "./pages/homepage";

function App() {

  return (
    <>
      <NavbarDefault />
      <div>
        <HomePage />
      </div>
    </>
  );
}

export default App;
