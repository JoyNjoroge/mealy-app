import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, UtensilsCrossed, LayoutDashboard, Edit, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editingUser, setEditingUser] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);

  const [userFormData, setUserFormData] = useState({ name: '', email: '', role: '', password: '' });
  const [mealFormData, setMealFormData] = useState({ name: '', description: '', price: '', image_url: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const usersRes = await apiService.request('/users');
      const mealsRes = await apiService.getMeals();

      setUsers(usersRes.items || usersRes || []);
      setMeals(mealsRes || []);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await apiService.request(`/users/${userId}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "Success", description: "User deleted successfully." });
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await apiService.request(`/meals/${mealId}`, { method: 'DELETE' });
      setMeals(meals.filter(m => m.id !== mealId));
      toast({ title: "Success", description: "Meal deleted successfully." });
    } catch (err) {
      console.error("Failed to delete meal:", err);
      toast({ title: "Error", description: "Failed to delete meal.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startEditingUser = (user) => {
    setEditingUser(user);
    setUserFormData({ name: user.name, email: user.email, role: user.role, password: '' });
  };

  const startEditingMeal = (meal) => {
    setEditingMeal(meal);
    setMealFormData({ name: meal.name, description: meal.description, price: meal.price, image_url: meal.image_url });
  };

  const cancelForm = () => {
    setEditingUser(null);
    setEditingMeal(null);
    setUserFormData({ name: '', email: '', role: 'customer', password: '' });
    setMealFormData({ name: '', description: '', price: '', image_url: '' });
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMealFormChange = (e) => {
    const { name, value } = e.target;
    setMealFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitUserEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...userFormData };
      if (payload.password === '') {
        delete payload.password;
      }

      await apiService.request(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast({ title: "Success", description: "User updated successfully!" });
      cancelForm();
      await loadData();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({ title: "Error", description: "Failed to update user. " + (error.message || "Please try again."), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEditMeal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...mealFormData,
        price: parseFloat(mealFormData.price),
        caterer_id: editingMeal.caterer_id
      };

      await apiService.request(`/meals/${editingMeal.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast({ title: "Success", description: "Meal updated successfully!" });
      cancelForm();
      await loadData();
    } catch (error) {
      console.error("Failed to update meal:", error);
      toast({ title: "Error", description: "Failed to update meal. " + (error.message || "Please try again."), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Conditional Rendering for Forms
  if (editingUser) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 font-sans flex justify-center items-start">
        <Card className="max-w-xl w-full shadow-lg rounded-lg bg-white p-8">
          <CardHeader className="mb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 text-center">Edit User: {editingUser.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitUserEdit} className="space-y-6">
              <div>
                <Label htmlFor="user-name" className="text-gray-700 font-medium mb-1 block">Name</Label>
                <Input id="user-name" name="name" value={userFormData.name} onChange={handleUserFormChange} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <Label htmlFor="user-email" className="text-gray-700 font-medium mb-1 block">Email</Label>
                <Input id="user-email" name="email" type="email" value={userFormData.email} onChange={handleUserFormChange} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <Label htmlFor="user-password-edit" className="text-gray-700 font-medium mb-1 block">New Password (optional)</Label>
                <Input id="user-password-edit" name="password" type="password" value={userFormData.password} onChange={handleUserFormChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Leave blank to keep current" />
              </div>
              <div>
                <Label htmlFor="user-role" className="text-gray-700 font-medium mb-1 block">Role</Label>
                <select id="user-role" name="role" value={userFormData.role} onChange={handleUserFormChange} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                  <option value="customer">Customer</option>
                  <option value="caterer">Caterer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button type="button" variant="outline" onClick={cancelForm}
                  className="h-10 px-6 text-base border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}
                  className="h-10 px-6 text-base bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only editing meal form is possible for admin
  if (editingMeal) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 font-sans flex justify-center items-start">
        <Card className="max-w-xl w-full shadow-lg rounded-lg bg-white p-8">
          <CardHeader className="mb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 text-center">
              Edit Meal: {mealFormData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEditMeal} className="space-y-6">
              <div>
                <Label htmlFor="meal-name" className="text-gray-700 font-medium mb-1 block">Meal Name</Label>
                <Input id="meal-name" name="name" value={mealFormData.name} onChange={handleMealFormChange} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-700 font-medium mb-1 block">Description</Label>
                <Textarea id="description" name="description" value={mealFormData.description} onChange={handleMealFormChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <Label htmlFor="price" className="text-gray-700 font-medium mb-1 block">Price (KES)</Label>
                <Input id="price" name="price" type="number" step="0.01" value={mealFormData.price} onChange={handleMealFormChange} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <Label htmlFor="image_url" className="text-gray-700 font-medium mb-1 block">Image URL</Label>
                <Input id="image_url" name="image_url" type="url" value={mealFormData.image_url} onChange={handleMealFormChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button type="button" variant="outline" onClick={cancelForm}
                  className="h-10 px-6 text-base border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}
                  className="h-10 px-6 text-base bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard Render (if no forms are active)
  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white shadow-md rounded-lg mb-7">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <LayoutDashboard size={32} className="text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Dashboard
          </h1>
          <span className="text-sm text-gray-600 hidden sm:block">Welcome Back, {user?.name || 'Admin'}!</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/')}
            className="h-9 px-5 text-sm border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm"
          >
            Go to Home
          </Button>
          <Button variant="destructive" onClick={logout}
            className="h-9 px-5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content Card */}
      <Card className="max-w-6xl mx-auto shadow-xl rounded-lg overflow-hidden bg-white">
        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 h-auto p-0 bg-gray-50 border-b border-gray-200 rounded-none">
              <TabsTrigger
                value="users"
                className="flex items-center justify-center gap-2 py-3 px-5 text-base font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 data-[state=active]:border-b-4 data-[state=active]:border-orange-500 transition-all duration-300"
              >
                <User size={18} /> Users
              </TabsTrigger>
              <TabsTrigger
                value="meals"
                className="flex items-center justify-center gap-2 py-3 px-5 text-base font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 data-[state=active]:border-b-4 data-[state=active]:border-orange-500 transition-all duration-300"
              >
                <UtensilsCrossed size={18} /> Meals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-2xl text-gray-800">User Management</h3>
              </div>
              {loading ? (
                <div className="flex flex-col justify-center items-center h-52 text-gray-600 text-base">
                  <Loader2 className="animate-spin mr-2 mb-2" size={20} /> Loading users...
                </div>
              ) : (
                users.length === 0 ? (
                  <div className="text-center text-gray-500 py-16 text-base">
                    <p>No users found on the platform.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">{user.role}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-center text-sm font-medium">
                              <div className="flex items-center justify-center gap-2"> {/* New: Flex container for buttons */}
                                <Button
                                  size="sm"
                                  onClick={() => startEditingUser(user)}
                                  className="h-8 px-4 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                                >
                                  <Edit size={14} /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="h-8 px-4 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                                >
                                  <Trash2 size={14} /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </TabsContent>

            <TabsContent value="meals" className="p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-2xl text-gray-800">Meal Management</h3>
              </div>
              {loading ? (
                <div className="flex flex-col justify-center items-center h-52 text-gray-600 text-base">
                  <Loader2 className="animate-spin mr-2 mb-2" size={20} /> Loading meals...
                </div>
              ) : (
                meals.length === 0 ? (
                  <div className="text-center text-gray-500 py-16 text-base">
                    <p>No meals found on the platform.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caterer ID</th>
                          <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {meals.map(meal => (
                          <tr key={meal.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900">{meal.id}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900">{meal.name}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900">KES {meal.price}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900">{meal.caterer_id}</td>
                            <td className="px-5 py-3 whitespace-nowrap text-center text-sm font-medium">
                              <div className="flex items-center justify-center gap-2"> {/* New: Flex container for buttons */}
                                <Button
                                  size="sm"
                                  onClick={() => startEditingMeal(meal)}
                                  className="h-8 px-4 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                                >
                                  <Edit size={14} /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteMeal(meal.id)}
                                  className="h-8 px-4 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                                >
                                  <Trash2 size={14} /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
