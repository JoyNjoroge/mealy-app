import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, User, Calendar, DollarSign } from 'lucide-react';

const OrderManagement = ({ onOrderUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const ordersData = await apiService.getCatererOrders();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Use the general update endpoint for all status changes
      await apiService.updateOrder(orderId, { status: newStatus });
      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
      loadOrders();
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
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
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => updateOrderStatus(order.id, 'confirmed')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => updateOrderStatus(order.id, 'cancelled')}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Cancel
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <Button 
            size="sm" 
            onClick={() => updateOrderStatus(order.id, 'completed')}
            className="bg-green-600 hover:bg-green-700"
          >
            Mark Complete
          </Button>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{order.meal_name || 'Unknown Meal'}</h4>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Customer:</span>
                        <span>{order.customer_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Date:</span>
                        <span>{new Date(order.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Quantity:</span>
                        <span>{order.quantity}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-green-600">
                          KES {order.total_price?.toLocaleString()}
                        </span>
                      </div>
                      {order.special_instructions && (
                        <div className="mb-1">
                          <span className="font-medium">Special Instructions:</span>
                          <p className="text-xs mt-1 bg-gray-50 p-2 rounded">
                            {order.special_instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                {getStatusActions(order)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;