import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Load token and user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Memoize isAuthenticated so it reacts to state changes
  const isAuthenticated = useMemo(() => {
    return !!token && !!user;
  }, [token, user]);

  const BASE_URL = '/api/auth';

  const login = async (credentials) => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      console.log('Login response:', response);
      const data = await response.json();
      console.log('Login data:', data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);

        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user.role}`,
        });

        return { success: true, user: data.user };
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
      return { success: false, message: "Network error" };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      console.log('Register response:', response);
      const data = await response.json();
      console.log('Register data:', data);
      // Do NOT set user or token here. Registration should not log in the user.
      if (response.ok) {
        toast({
          title: "Account created!",
          description: "Please log in with your credentials",
        });
        return { success: true };
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Unable to create account",
          variant: "destructive",
        });
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: "Registration error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
      return { success: false, message: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    toast({
      title: "Logged out",
      description: "Come back soon!",
    });
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    getAuthHeaders,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
