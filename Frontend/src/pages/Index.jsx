import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to appropriate dashboard based on user role
  if (user?.role === 'customer') {
    return <Navigate to="/customer" replace />;
  } else if (user?.role === 'caterer' || user?.role === 'admin') {
    return <Navigate to="/caterer" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default Index;