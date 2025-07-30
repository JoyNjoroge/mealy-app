import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Clock, CheckCircle, XCircle, User, MapPin, LogOut } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [availableMeals, setAvailableMeals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [menuData, ordersData] = await Promise.all([
        apiService.getTodaysMenu(),
        apiService.getOrderHistory()
      ]);
      
      setAvailableMeals(menuData.meals || []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out",
    });
  };

  const placeOrder = async (meal) => {
    try {
      const orderData = {
        meal_id: meal.id,
        quantity: quantity,
        total_price: meal.meal_price * quantity,
        special_instructions: specialInstructions
      };

      await apiService.createOrder(orderData);
      
      toast({
        title: "Order placed successfully!",
        description: `Your order for ${meal.meal_name} has been placed.`,
      });

      // Reset form
      setSelectedMeal(null);
      setQuantity(1);
      setSpecialInstructions('');
      
      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Failed to place order:', error);
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await apiService.cancelOrder(orderId);
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
      loadDashboardData();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Logout */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || 'Customer'}! 👋
            </h1>
            <p className="text-gray-600">
              Discover delicious meals from our amazing caterers
            </p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Meals Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Available Meals Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableMeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No meals available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableMeals.map((meal) => (
                    <Card key={meal.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                              {meal.meal_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {meal.meal_description}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <User className="h-4 w-4" />
                              <span>from {meal.caterer_name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">
                              KES {meal.meal_price?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {meal.meal_image_url && (
                          <img 
                            src={meal.meal_image_url} 
                            alt={meal.meal_name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        
                        <Button 
                          onClick={() => setSelectedMeal(meal)}
                          className="w-full"
                        >
                          Order Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order History Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No orders yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <Card key={order.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{order.meal_name || 'Unknown Meal'}</h4>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Quantity: {order.quantity}</p>
                        <p>Total: KES {order.total_price?.toLocaleString()}</p>
                        <p>Date: {new Date(order.timestamp).toLocaleDateString()}</p>
                      </div>
                      {order.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={() => cancelOrder(order.id)}
                        >
                          Cancel Order
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedMeal.meal_name}</h3>
                <p className="text-gray-600 text-sm mb-2">{selectedMeal.meal_description}</p>
                <p className="font-bold text-green-600">KES {selectedMeal.meal_price?.toLocaleString()}</p>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                <Input
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests?"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => placeOrder(selectedMeal)}
                  className="flex-1"
                >
                  Place Order (KES {(selectedMeal.meal_price * quantity).toLocaleString()})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedMeal(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;