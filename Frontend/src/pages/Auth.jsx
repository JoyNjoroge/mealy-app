import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UtensilsCrossed } from "lucide-react";
import heroImage from "@/assets/hero-food.jpg";

export const Auth = () => {
  const { login, register, isLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    email: "", 
    password: "", 
    role: "customer"
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      await login(loginForm.email, loginForm.password);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.email && registerForm.password && registerForm.role) {
      await register(registerForm.email, registerForm.password, registerForm.role);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Hero Section - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-8">
          <div className="flex items-center space-x-3 mb-6">
            <UtensilsCrossed className="h-12 w-12 text-white" />
            <h1 className="text-4xl font-bold text-white">Mealy</h1>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Delicious meals, delivered fresh
          </h2>
          <p className="text-lg text-white/90 max-w-md">
            Join our community of food lovers and discover amazing meals prepared by top caterers in your area.
          </p>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <UtensilsCrossed className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mealy
            </h1>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <Card className="card-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-primary" 
                      disabled={isLoading || !loginForm.email || !loginForm.password}
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Card className="card-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    Join Mealy and start your culinary journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role">I want to</Label>
                      <Select 
                        value={registerForm.role} 
                        onValueChange={(value) => 
                          setRegisterForm({ ...registerForm, role: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Order delicious meals</SelectItem>
                          <SelectItem value="caterer">Provide catering services</SelectItem>
                          <SelectItem value="admin">Manage the platform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-primary" 
                      disabled={isLoading || !registerForm.email || !registerForm.password}
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};