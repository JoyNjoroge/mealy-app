import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect authenticated users to their dashboard
      switch (user.role) {
        case 'customer':
          navigate('/customer');
          break;
        case 'caterer':
          navigate('/caterer');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          break;
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // This component should not render for authenticated users
  // as they get redirected above
  return null;
};

export default Index;
