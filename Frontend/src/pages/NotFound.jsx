import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background px-4">
      <Card className="w-full max-w-md shadow-card animate-fade-in text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-warm rounded-full flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
          <CardTitle className="text-4xl font-bold text-primary">404</CardTitle>
          <CardDescription className="text-lg">
            Oops! This page doesn't exist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for might have been moved or deleted.
          </p>
          <Link to="/">
            <Button className="w-full bg-gradient-primary hover:shadow-glow transition-smooth">
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
