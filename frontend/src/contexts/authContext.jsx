import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

export const AuthContext = React.createContext({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for authentication token in cookies
    const token = Cookies.get("auth_token");
    setIsLoggedIn(!!token); // Set to true if token exists
  }, []);

  const login = (token) => {
    Cookies.set("auth_token", token, { expires: 7, secure: true });
    setIsLoggedIn(true);
  };

  const logout = () => {
    Cookies.remove("auth_token");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
