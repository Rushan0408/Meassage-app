"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  status?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshToken: () => Promise<boolean>;
  fetchUserData: (token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token in localStorage
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      
      // Fetch user data if token exists
      fetchUserData(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If token is invalid, try refreshing it
        const refreshed = await refreshToken();
        if (!refreshed) {
          // If refresh fails, log the user out
          logout();
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await fetch("http://localhost:8080/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if the response has a token property
        const newToken = data.token || data["token : "] || data["token"];
        
        if (newToken) {
          localStorage.setItem("token", newToken);
          setToken(newToken);
          
          // Fetch user data with the new token
          await fetchUserData(newToken);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    fetchUserData(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout,
      isAuthenticated: !!token,
      refreshToken,
      fetchUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
} 