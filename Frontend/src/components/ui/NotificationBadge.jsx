import React from 'react';

const NotificationBadge = ({ count = 0, children }) => {
  return (
    <div className="relative">
      {children}
      {count > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 animate-bounce-in">
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;