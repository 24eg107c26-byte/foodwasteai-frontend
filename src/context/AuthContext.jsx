import { createContext, useContext, useState } from "react";
import api, { STORAGE_KEY } from "../services/api";

const AuthContext = createContext(null);

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const saveUser = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    saveUser(response.data);
    return response.data;
  };

  const register = async (form) => {
    const response = await api.post("/auth/register", form);
    saveUser(response.data); // registering also logs the user in
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}