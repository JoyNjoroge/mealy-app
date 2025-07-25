// src/pages/DashboardRouter.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const DashboardRouter = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (user?.role === 'customer') {
      navigate('/customer', { replace: true });
    } else if (user?.role === 'caterer') {
      navigate('/caterer', { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/unauthorized', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default DashboardRouter;
