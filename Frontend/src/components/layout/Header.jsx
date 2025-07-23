import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import NotificationBadge from '@/components/ui/NotificationBadge';

const Header = ({ title, notificationCount = 0 }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card border-b border-border px-4 py-3 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground capitalize">
              Welcome back, {user?.name}!
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <NotificationBadge count={notificationCount}>
            <Button variant="outline" size="sm" className="relative">
              🔔
            </Button>
          </NotificationBadge>
          
          <Button 
            onClick={logout}
            variant="outline" 
            size="sm"
            className="hover:bg-destructive hover:text-destructive-foreground transition-smooth"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;