import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate('/', { replace: true }); // Let DashboardRouter decide
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(formData);
    console.log('Login result:', result);

    if (result.success) {
      navigate('/'); // Let DashboardRouter handle where to go
    }

    setIsSubmitting(false);
  };

  // Show loading UI while auth state is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background px-4">
      <Card className="w-full max-w-md shadow-card animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🍱</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to Mealy
          </CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="transition-smooth focus:shadow-soft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="transition-smooth focus:shadow-soft"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:shadow-glow transition-smooth" 
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link 
              to="/register" 
              className="text-primary hover:text-primary-light transition-smooth underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
