// src/routes/index.js
import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/homePage";
import PodcastLive from "../pages/podcastLive";
import { SignupPage, LoginPage } from "../pages/authPage";
import Layout from "../layouts/layout";
import FollowingPage from "../pages/followingPage";
import AccountPage from "../pages/accountPage";
import Cookies from "js-cookie";
import AnalyticsPage from "../pages/analyticsPage";
import ContentPage from "@/pages/contentPage";
import DashboardPage from "@/pages/dashboardPage";

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
    element: <Layout withSidebar={false} />,
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
      },
    ],
  },
  {
    element: <Layout withSidebar={true} />,
    children: [
      {
        path: "/analytics",
        element: <AnalyticsPage />,
        loader: ProtectedLoader,
      },
      {
        path: "/content",
        element: <ContentPage />,
        loader: ProtectedLoader,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
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
