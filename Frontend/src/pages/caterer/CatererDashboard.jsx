import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  DollarSign, 
  LogOut,
  Home,
  Utensils,
  Receipt,
  TrendingUp,
  Printer,
  Download,
  Calendar
} from 'lucide-react';
import MealManagement from '../../components/restaurant/MealManagement';
import OrderManagement from '../../components/order/OrderManagement';
import MenuManagement from '../../components/restaurant/MenuManagement';

const CatererDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    mealCount: 0,
    menuCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await apiService.getCatererStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      const revenue = await apiService.getCatererRevenue();
      setRevenueData(revenue);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    loadRevenueData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out",
    });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handlePrintRevenue = () => {
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Revenue Report - ${today}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
            .stat-label { color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f3f4f6; }
            .total { font-weight: bold; background-color: #f0fdf4; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Revenue Report</h1>
            <p>Generated on: ${today}</p>
            <p>Caterer: ${user?.name || 'Unknown'}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">KES ${stats.total_revenue?.toLocaleString() || 0}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.total_orders_count || 0}</div>
              <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.completed_orders_count || 0}</div>
              <div class="stat-label">Completed Orders</div>
            </div>
          </div>
          
          <h2>Revenue Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${revenueData.map(day => `
                <tr>
                  <td>${day.date}</td>
                  <td>${day.orders_count}</td>
                  <td>KES ${day.revenue?.toLocaleString() || 0}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td><strong>Total</strong></td>
                <td><strong>${stats.total_orders_count || 0}</strong></td>
                <td><strong>KES ${stats.total_revenue?.toLocaleString() || 0}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportRevenue = () => {
    const csvContent = [
      ['Date', 'Orders', 'Revenue'],
      ...revenueData.map(day => [
        day.date,
        day.orders_count,
        day.revenue || 0
      ]),
      ['Total', stats.total_orders_count || 0, stats.total_revenue || 0]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Revenue exported!",
      description: "Revenue data has been downloaded as CSV",
    });
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
      {/* Header with Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || 'Caterer'}! 👨‍🍳
            </h1>
            <p className="text-gray-600">
              Manage your meals, orders, and revenue
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {stats.total_revenue?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_orders_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending_orders_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed_orders_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
            <Utensils className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.meal_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Menus</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.menu_count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Management Sections */}
      <Tabs defaultValue="meals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="meals" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Meals
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="menus" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Menus
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Meal Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MealManagement onMealUpdate={loadDashboardStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderManagement onOrderUpdate={loadDashboardStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menus" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Menu Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MenuManagement onMenuUpdate={loadDashboardStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Management
              </CardTitle>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handlePrintRevenue}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
                <Button 
                  onClick={handleExportRevenue}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        KES {stats.total_revenue?.toLocaleString() || 0}
                      </div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.total_orders_count || 0}
                      </div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">
                        KES {stats.total_revenue && stats.total_orders_count ? 
                          Math.round(stats.total_revenue / stats.total_orders_count) : 0}
                      </div>
                      <p className="text-sm text-gray-600">Average Order Value</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Chart/Table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Orders</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {revenueData.map((day, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{day.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{day.orders_count}</td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">
                              KES {day.revenue?.toLocaleString() || 0}
                            </td>
                          </tr>
                        ))}
                        {revenueData.length === 0 && (
                          <tr>
                            <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                              No revenue data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CatererDashboard;