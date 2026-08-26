import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await api.get("/profile");
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const signin = async (data) => {
    const res = await api.post("/signin", data);
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post("/signup", data);
    setUser(res.data.user);
    return res.data;
  };

  const signout = async () => {
    await api.post("/signout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
