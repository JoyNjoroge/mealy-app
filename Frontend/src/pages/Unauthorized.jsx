import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background px-4">
      <Card className="w-full max-w-md shadow-card animate-fade-in text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-warm rounded-full flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Please contact an administrator if you believe this is an error.
          </p>
          <Link to="/">
            <Button className="w-full bg-gradient-primary hover:shadow-glow transition-smooth">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;