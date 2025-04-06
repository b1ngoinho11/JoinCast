import React from "react";
import { AuthProvider as Provider } from "./authContext.jsx";

// Create and export the context with default values
export const AuthContext = React.createContext({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
  loading: false,
  error: null,
});

// Re-export the provider for easier imports
export const AuthProvider = Provider;
