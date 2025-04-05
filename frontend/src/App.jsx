import "./css/App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { RouterProvider } from "react-router-dom";
import router from "./router/index";
import { AuthProvider } from "./contexts/authContext";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  );
}

export default App;
