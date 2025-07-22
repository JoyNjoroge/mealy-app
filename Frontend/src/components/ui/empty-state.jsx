import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <Card className={cn("card-elegant", className)}>
      <CardContent className="py-12 text-center">
        <Icon className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="btn-primary">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};