import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { 
  User, 
  LogOut, 
  UtensilsCrossed,
  Menu 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Mealy", 
  showNotifications = true,
  children
}) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {children}
            
            {user && (
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                {showNotifications && <NotificationPanel />}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user.role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {children}
                  
                  {user && (
                    <>
                      <div className="border-t pt-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <User className="h-5 w-5" />
                          <div>
                            <p className="text-sm font-medium">{user.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {user.role}
                            </p>
                          </div>
                        </div>
                        
                        {showNotifications && (
                          <div className="mb-2">
                            <NotificationPanel>
                              <Button variant="ghost" className="w-full justify-start">
                                Notifications
                              </Button>
                            </NotificationPanel>
                          </div>
                        )}
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive"
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};