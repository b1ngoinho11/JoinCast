// src/routes/index.js
import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/homePage";
import PodcastLive from "../pages/podcastLive";
import { SignupPage, LoginPage } from "../pages/authPage";
import Layout from "../layouts/layout";
import FollowingPage from "../pages/followingPage";
import AccountPage from "../pages/accountPage";
import Cookies from "js-cookie";

const ProtectedLoader = () => {
  const token = Cookies.get("auth_token");
  if (!token) {
    window.location.href = "/login";
  }
  return null;
}

const AuthLoader = () => {
  const token = Cookies.get("auth_token");
  if (token) {
    window.location.href = "/";
  }
  return null;
}


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
      {
        path: "/following",
        element: <FollowingPage />,
      },
      {
        path: "/myaccount",
        element: <AccountPage />,
        loader: ProtectedLoader,
      }
    ],
  },
  {
    path: "/signup",
    element: <SignupPage />,
    loader: AuthLoader,
  },
  {
    path: "/login",
    element: <LoginPage />,
    loader : AuthLoader,
  },
]);

export default router;
