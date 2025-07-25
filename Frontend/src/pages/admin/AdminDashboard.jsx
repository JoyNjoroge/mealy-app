import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import apiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const usersRes = await apiService.request('/users');
      const mealsRes = await apiService.getMeals();
      setUsers(usersRes.items || []);
      setMeals(mealsRes || []);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await apiService.request(`/users/${userId}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {}
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Delete this meal?')) return;
    try {
      await apiService.deleteMeal(mealId);
      setMeals(meals.filter(m => m.id !== mealId));
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="flex justify-end gap-2 p-4">
        <Button variant="outline" onClick={() => navigate('/')}>Go to Home</Button>
        <Button variant="destructive" onClick={logout}>Logout</Button>
      </div>
      <Card className="max-w-5xl mx-auto shadow-card">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="meals">Meals</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <h3 className="font-semibold text-lg mb-4">All Users</h3>
              {loading ? <div>Loading...</div> : (
                <table className="w-full border text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">{user.id}</td>
                        <td className="p-2">{user.name}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2 capitalize">{user.role}</td>
                        <td className="p-2 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => alert('Edit user coming soon')}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TabsContent>
            <TabsContent value="meals">
              <h3 className="font-semibold text-lg mb-4">All Meals</h3>
              {loading ? <div>Loading...</div> : (
                <table className="w-full border text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Caterer</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meals.map(meal => (
                      <tr key={meal.id} className="border-b">
                        <td className="p-2">{meal.id}</td>
                        <td className="p-2">{meal.name}</td>
                        <td className="p-2">₦{meal.price}</td>
                        <td className="p-2">{meal.caterer_id}</td>
                        <td className="p-2 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => alert('Edit meal coming soon')}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteMeal(meal.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 