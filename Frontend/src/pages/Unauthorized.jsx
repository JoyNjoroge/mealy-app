import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { Link } from "react-router-dom";

export const Unauthorized = () => {
  const { user } = useAuth();

  const getRedirectPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'customer': return '/customer';
      case 'caterer': return '/caterer';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="card-elegant max-w-md w-full animate-fade-in">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-warning mb-6" />
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <Button asChild className="btn-primary w-full">
              <Link to={getRedirectPath()}>
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};