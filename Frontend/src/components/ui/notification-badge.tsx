import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
  children: React.ReactNode;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  max = 99, 
  className, 
  children 
}) => {
  if (count <= 0) {
    return <>{children}</>;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <div className={cn("relative", className)}>
      {children}
      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
        {displayCount}
      </Badge>
    </div>
  );
};