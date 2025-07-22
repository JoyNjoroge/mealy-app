import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiService, endpoints } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  ShoppingCart, 
  Star,
  ChefHat
} from "lucide-react";

interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  rating?: number;
}

interface Menu {
  id: number;
  date: string;
  meals: Meal[];
  is_active: boolean;
}

interface Order {
  id: number;
  meal_id: number;
  meal_name: string;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
}

export const CustomerDashboard = () => {
  const [todaysMenu, setTodaysMenu] = useState<Menu | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderingLoading, setIsOrderingLoading] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [menuResponse, ordersResponse] = await Promise.all([
        apiService.get<Menu>(endpoints.todaysMenu),
        apiService.get<Order[]>(endpoints.myOrders)
      ]);
      
      setTodaysMenu(menuResponse);
      setMyOrders(ordersResponse);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderMeal = async (mealId: number, mealName: string, price: number) => {
    try {
      setIsOrderingLoading(mealId);
      await apiService.post(endpoints.orders, {
        meal_id: mealId,
        quantity: 1
      });
      
      toast({
        title: "Order placed!",
        description: `Your order for ${mealName} has been placed successfully.`,
      });
      
      // Reload orders
      loadData();
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsOrderingLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'secondary';
      case 'ready': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Customer Dashboard" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Customer Dashboard" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Welcome Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-muted-foreground">Discover today's delicious meals and manage your orders.</p>
          </div>

          {/* Today's Menu */}
          <div className="animate-slide-up">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Today's Menu</h2>
              {todaysMenu && (
                <Badge variant="secondary" className="ml-2">
                  {new Date(todaysMenu.date).toLocaleDateString()}
                </Badge>
              )}
            </div>

            {todaysMenu && todaysMenu.meals.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {todaysMenu.meals.map((meal) => (
                  <Card key={meal.id} className="card-menu animate-bounce-in">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{meal.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {meal.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {meal.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-success" />
                          <span className="text-2xl font-bold text-success">
                            ${meal.price.toFixed(2)}
                          </span>
                        </div>
                        {meal.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-accent fill-current" />
                            <span className="text-sm font-medium">{meal.rating}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full btn-primary"
                        onClick={() => handleOrderMeal(meal.id, meal.name, meal.price)}
                        disabled={isOrderingLoading === meal.id}
                      >
                        {isOrderingLoading === meal.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Order Now
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-elegant">
                <CardContent className="py-12 text-center">
                  <ChefHat className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No menu available</h3>
                  <p className="text-muted-foreground">
                    Today's menu hasn't been set yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Orders */}
          <div className="animate-slide-up">
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Recent Orders</h2>
            </div>

            {myOrders.length > 0 ? (
              <div className="grid gap-4">
                {myOrders.slice(0, 5).map((order) => (
                  <Card key={order.id} className="card-elegant">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold">{order.meal_name}</h3>
                            <Badge variant={getStatusColor(order.status) as any}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>Qty: {order.quantity}</span>
                            <span>${order.total_price.toFixed(2)}</span>
                            <span>{new Date(order.order_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-elegant">
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">
                    Place your first order from today's menu above!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};