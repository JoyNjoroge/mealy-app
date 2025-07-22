import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import apiService from '@/services/api';
import { toast } from '@/hooks/use-toast';

const OrderManagement = ({ onStatsUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiService.updateOrder(orderId, { status: newStatus });
      toast({
        title: "Order updated!",
        description: `Order status changed to ${newStatus}`,
      });
      loadOrders();
      onStatsUpdate && onStatsUpdate();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>Order Management</span>
            </CardTitle>
            <CardDescription>
              View and manage customer orders
            </CardDescription>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl">📝</span>
            <p className="mt-2 text-muted-foreground">
              {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 hover:shadow-soft transition-smooth">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{order.meal_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer: {order.customer_name || 'Unknown'} • {order.customer_email || 'No email'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ordered: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">₦{order.total_price}</div>
                    <Badge variant={getStatusVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="flex space-x-2 pt-3 border-t">
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="bg-gradient-success hover:shadow-glow"
                      size="sm"
                    >
                      Confirm Order
                    </Button>
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      variant="outline"
                      size="sm"
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {order.status === 'confirmed' && (
                  <div className="flex space-x-2 pt-3 border-t">
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="bg-gradient-primary hover:shadow-glow"
                      size="sm"
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderManagement;