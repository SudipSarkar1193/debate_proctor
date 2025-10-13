import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface User {
  id: string;
  username: string;
  role?: string; // optional — we can adjust based on our need (e.g., "moderator" | "participant")
  password?: string; // optional for security reasons
}

// 💡 Define the context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// 🧠 Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🪄 Custom hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// 🏠 Props type for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// 🧩 AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("debateUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("debateUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("debateUser");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
