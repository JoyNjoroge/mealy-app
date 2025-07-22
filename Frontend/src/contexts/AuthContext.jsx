import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        apiService.setAuthToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await apiService.post('/auth/login', { email, password });
      
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        apiService.setAuthToken(response.token);
        
        toast({
          title: "Welcome back!",
          description: `Logged in as ${response.user.role}`,
        });

        // Redirect based on role
        const role = response.user.role;
        if (role === 'customer') {
          navigate('/customer');
        } else if (role === 'caterer') {
          navigate('/caterer');
        } else if (role === 'admin') {
          navigate('/admin');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, role) => {
    try {
      setIsLoading(true);
      const response = await apiService.post('/auth/register', { email, password, role });
      
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        apiService.setAuthToken(response.token);
        
        toast({
          title: "Account created!",
          description: `Welcome to Mealy, ${response.user.role}`,
        });

        // Redirect based on role
        const userRole = response.user.role;
        if (userRole === 'customer') {
          navigate('/customer');
        } else if (userRole === 'caterer') {
          navigate('/caterer');
        } else if (userRole === 'admin') {
          navigate('/admin');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.clearAuthToken();
    
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    
    navigate('/');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};