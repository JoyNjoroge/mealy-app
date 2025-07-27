import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/common/Header';
import Loading from '@/components/common/Loading';
import apiService from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [menuData, ordersData] = await Promise.all([
        apiService.getTodaysMenu(),
        apiService.getOrderHistory(),
      ]);
      setMenu(menuData.meals || []);
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async (menuItemId) => {
    try {
      setIsOrdering(true);
      await apiService.createOrder({ menu_item_id: menuItemId });
      toast({
        title: "Order placed!",
        description: "Your meal has been ordered successfully",
      });
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setIsOrdering(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await apiService.deleteOrder(orderId);
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled",
        variant: "destructive",
      });
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header title="Customer Dashboard" />
        <div className="flex items-center justify-center py-20">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header title="Customer Dashboard" notificationCount={0} />
      
      <div className="flex justify-end gap-2 p-4">
        <Button variant="outline" onClick={() => navigate('/')}>Go to Home</Button>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Today's Menu */}
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🍽️</span>
              <span>Today's Menu</span>
            </CardTitle>
            <CardDescription>
              Fresh meals available for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {menu.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">😔</span>
                <p className="mt-2 text-muted-foreground">No menu available today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menu.map((meal) => (
                  <Card key={meal.id} className="border hover:shadow-soft transition-smooth">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{meal.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-primary">₦{meal.price}</span>
                          <Badge variant="secondary">{meal.category}</Badge>
                        </div>
                        <Button
                          onClick={() => placeOrder(meal.menu_item_id)}
                          disabled={isOrdering}
                          className="bg-gradient-primary hover:shadow-glow transition-smooth"
                          size="sm"
                        >
                          {isOrdering ? <Loading size="sm" /> : 'Order Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>Your Orders</span>
            </CardTitle>
            <CardDescription>
              Track your recent meal orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📝</span>
                <p className="mt-2 text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                    <div className="flex-1">
                      <h4 className="font-medium">{order.meal_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()} • ₦{order.total_price}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {order.status}
                      </Badge>
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => cancelOrder(order.id)}
                          variant="outline"
                          size="sm"
                          className="hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;