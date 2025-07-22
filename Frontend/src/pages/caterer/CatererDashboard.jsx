import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MealForm } from "@/components/forms/MealForm";
import { apiService, endpoints } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle
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

interface Order {
  id: number;
  meal_id: number;
  meal_name: string;
  customer_email: string;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
}

interface Revenue {
  daily: number;
  weekly: number;
  monthly: number;
  total_orders: number;
}

export const CatererDashboard = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | undefined>(undefined);
  const [isMealFormOpen, setIsMealFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [mealsResponse, ordersResponse, revenueResponse] = await Promise.all([
        apiService.get<Meal[]>(endpoints.meals),
        apiService.get<Order[]>(endpoints.allOrders),
        apiService.get<Revenue>(endpoints.revenue)
      ]);
      
      setMeals(mealsResponse);
      setOrders(ordersResponse);
      setRevenue(revenueResponse);
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

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiService.patch(endpoints.order(orderId), { status });
      
      toast({
        title: "Order updated",
        description: `Order status changed to ${status}`,
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
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

  const handleAddMeal = () => {
    setSelectedMeal(undefined);
    setIsMealFormOpen(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsMealFormOpen(true);
  };

  const handleDeleteMeal = async (mealId: number) => {
    try {
      await apiService.delete(endpoints.meal(mealId));
      toast({
        title: "Meal deleted",
        description: "Meal has been removed successfully.",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMealFormSuccess = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Caterer Dashboard" />
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
      <Header title="Caterer Dashboard" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Welcome Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Caterer Dashboard</h1>
            <p className="text-muted-foreground">Manage your meals, track orders, and monitor revenue.</p>
          </div>

          {/* Stats Cards */}
          {revenue && (
            <div className="grid gap-6 md:grid-cols-4 animate-slide-up">
              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">${revenue.daily.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{revenue.total_orders}</div>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Meals</CardTitle>
                  <Users className="h-4 w-4 text-info" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{meals.length}</div>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">${revenue.monthly.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="orders" className="animate-slide-up">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="meals">Meals</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Recent Orders</h2>
              </div>

              {orders.length > 0 ? (
                <div className="grid gap-4">
                  {orders.map((order) => (
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
                              <span>{order.customer_email}</span>
                              <span>Qty: {order.quantity}</span>
                              <span>${order.total_price.toFixed(2)}</span>
                              <span>{new Date(order.order_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Prepare
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                className="btn-success"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                              >
                                Ready
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-elegant">
                  <CardContent className="py-12 text-center">
                    <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground">
                      Orders will appear here once customers start ordering your meals.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="meals" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Meals</h2>
                <Button className="btn-primary" onClick={handleAddMeal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meal
                </Button>
              </div>

              {meals.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {meals.map((meal) => (
                    <Card key={meal.id} className="card-elegant">
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
                        </div>
                      </CardContent>
                      <CardFooter className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditMeal(meal)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteMeal(meal.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-elegant">
                  <CardContent className="py-12 text-center">
                    <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No meals yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first meal to offer to customers.
                    </p>
                    <Button className="btn-primary" onClick={handleAddMeal}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Meal
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="menu" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Menu Management</h2>
                <Button className="btn-primary">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Menu
                </Button>
              </div>

              <Card className="card-elegant">
                <CardContent className="py-12 text-center">
                  <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Menu Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Create daily menus by selecting from your available meals.
                  </p>
                  <Button className="btn-primary">
                    <Calendar className="mr-2 h-4 w-4" />
                    Create Today's Menu
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Meal Form Modal */}
      <MealForm
        meal={selectedMeal}
        isOpen={isMealFormOpen}
        onClose={() => setIsMealFormOpen(false)}
        onSuccess={handleMealFormSuccess}
      />
    </div>
  );
};