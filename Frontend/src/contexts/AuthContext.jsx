import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import apiService from '@/services/api';

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
      const data = await apiService.login(credentials);
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.role}`,
      });
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    try {
      await apiService.register(userData);
      
      toast({
        title: "Account created!",
        description: "Please log in with your credentials",
      });
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account",
        variant: "destructive",
      });
      return { success: false, message: error.message };
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
