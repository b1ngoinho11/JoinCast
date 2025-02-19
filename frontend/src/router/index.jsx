// src/routes/index.js
import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/homepage";
import PodcastLive from "../pages/podcastLive";
import { SignupPage, LoginPage } from "../pages/authPage";
import Layout from "../layouts/layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/podcast/:id",
        element: <PodcastLive />,
      },
    ],
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);

export default router;
