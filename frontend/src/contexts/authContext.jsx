import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import Cookies from "js-cookie";
import { authAPI } from "../services/api";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("auth_token");
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
          setIsLoggedIn(true);
        } catch (err) {
          console.error("Auth token invalid:", err);
          Cookies.remove("auth_token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(credentials);
      
      // Check if the response structure matches what we expect
      if (response.data && response.data.access_token && response.data.refresh_token) {
        const { access_token, refresh_token } = response.data;
        
        // Store the tokens - HERE is where we save the access token in cookies
        Cookies.set("auth_token", access_token, { expires: 7, secure: true });
        Cookies.set("refresh_token", refresh_token, { expires: 30, secure: true });
        
        try {
          // Get user data
          const userResponse = await authAPI.getCurrentUser();
          setUser(userResponse.data);
          setIsLoggedIn(true);
          setLoading(false);
          return true;
        } catch (userErr) {
          console.error("Error getting user data:", userErr);
          // If we can't get the user data, still consider the login successful but log the error
          setIsLoggedIn(true);
          setLoading(false);
          return true;
        }
      } else {
        console.error("Unexpected login response format:", response.data);
        setError("Invalid response from server");
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      // Properly extract the error message from the response
      let errorMessage = "Login failed";
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.data && err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else {
          errorMessage = `Error ${err.response.status}: ${err.response.statusText}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      }
      
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    Cookies.remove("auth_token");
    Cookies.remove("refresh_token");
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
