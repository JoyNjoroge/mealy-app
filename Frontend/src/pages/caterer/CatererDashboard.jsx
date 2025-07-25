import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/common/Header';
import Loading from '@/components/common/Loading';
import MealManagement from '@/components/restaurant/MealManagement';
import MenuManagement from '@/components/restaurant/MenuManagement';
import OrderManagement from '@/components/order/OrderManagement';
import apiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CatererDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalMeals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      const [orders, meals, revenue] = await Promise.all([
        apiService.getOrders(),
        apiService.getMeals(),
        apiService.getDailyRevenue(new Date().toISOString().split('T')[0]),
      ]);
      
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      
      setStats({
        totalOrders: orders.length,
        todayRevenue: revenue.total || 0,
        pendingOrders,
        totalMeals: meals.length,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header title="Caterer Dashboard" />
        <div className="flex items-center justify-center py-20">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header title="Caterer Dashboard" notificationCount={stats.pendingOrders} />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-end gap-2 p-4">
          <Button variant="outline" onClick={() => navigate('/')}>Go to Home</Button>
          <Button variant="destructive" onClick={logout}>Logout</Button>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">₦{stats.todayRevenue}</div>
              <div className="text-sm text-muted-foreground">Today's Revenue</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{stats.pendingOrders}</div>
              <div className="text-sm text-muted-foreground">Pending Orders</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{stats.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalMeals}</div>
              <div className="text-sm text-muted-foreground">Total Meals</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="meals" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-3">
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meals" className="mt-6">
            <MealManagement onStatsUpdate={loadDashboardStats} />
          </TabsContent>
          
          <TabsContent value="menu" className="mt-6">
            <MenuManagement />
          </TabsContent>
          
          <TabsContent value="orders" className="mt-6">
            <OrderManagement onStatsUpdate={loadDashboardStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CatererDashboard;