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
  isLoading: boolean;
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
      console.log('Fetching user data with token:', token);
      const response = await fetch("http://localhost:8080/api/auth/me", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('User data response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data received:', userData);
        setUser(userData);
      } else {
        // If token is invalid, try refreshing it
        console.error('Failed to fetch user data:', response.status, response.statusText);
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.error('Token refresh failed');
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Find token in the response, try all possible keys and formats
        let newToken = null;
        
        // Try standard keys first
        if (data.token || data["token : "] || data["token "]) {
          newToken = data.token || data["token : "] || data["token "];
        } else {
          // If not found, look for any property that looks like a token
          for (const key in data) {
            if (typeof data[key] === 'string' && data[key].length > 20) {
              newToken = data[key];
              break;
            }
          }
        }
        
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
      fetchUserData,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
} 