import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Loading from '@/components/common/Loading.jsx';
import apiService from '@/services/api';
import { toast } from '@/hooks/use-toast';

const MealManagement = () => {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: null
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setIsLoading(true);
      const mealsData = await apiService.getCatererMeals();
      setMeals(mealsData);
    } catch (error) {
      console.error('Failed to load meals:', error);
      toast({
        title: "Failed to load meals",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (mealId, available) => {
    try {
      await apiService.toggleMealAvailability(mealId, available);
      toast({
        title: available ? "Meal made available" : "Meal made unavailable",
        description: "Meal availability updated successfully",
      });
      loadMeals(); // Refresh the list
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      toast({
        title: "Failed to update availability",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      if (editingMeal) {
        await apiService.updateMeal(editingMeal.id, formData);
        toast({
          title: "Meal updated!",
          description: "Meal has been updated successfully",
        });
      } else {
        await apiService.createMeal(formData);
        toast({
          title: "Meal created!",
          description: "New meal has been added successfully",
        });
      }
      
      setFormData({ name: '', description: '', price: '', image: null });
      setEditingMeal(null);
      setShowForm(false);
      loadMeals();
    } catch (error) {
      console.error('Failed to save meal:', error);
      toast({
        title: "Failed to save meal",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      description: meal.description,
      price: meal.price.toString(),
      image: null
    });
    setShowForm(true);
  };

  const handleDelete = async (mealId) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await apiService.deleteMeal(mealId);
        toast({
          title: "Meal deleted!",
          description: "Meal has been deleted successfully",
        });
        loadMeals();
      } catch (error) {
        console.error('Failed to delete meal:', error);
        toast({
          title: "Failed to delete meal",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-20">
          <Loading size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Meal Form */}
      {showForm && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{editingMeal ? '✏️' : '➕'}</span>
              <span>{editingMeal ? 'Edit Meal' : 'Add New Meal'}</span>
            </CardTitle>
            <CardDescription>
              {editingMeal ? 'Update meal details' : 'Add a new meal to your menu'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Meal Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter meal name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your meal"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price (KES)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loading size="sm" /> : (editingMeal ? 'Update Meal' : 'Add Meal')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingMeal(null);
                  setFormData({ name: '', description: '', price: '', image: null });
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Meals List */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>🍽️</span>
                <span>My Meals</span>
              </CardTitle>
              <CardDescription>
                Manage your meals and their availability
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-success hover:shadow-glow transition-smooth"
            >
              Add New Meal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🍽️</span>
              <p className="mt-2 text-muted-foreground">
                No meals yet. Add your first meal!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meals.map((meal) => (
                <div key={meal.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                  {meal.image_url && (
                    <img 
                      src={meal.image_url} 
                      alt={meal.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{meal.name}</h3>
                    <Badge variant={meal.available ? "default" : "secondary"}>
                      {meal.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{meal.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-primary">kes{meal.price}</span>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`available-${meal.id}`} className="text-sm">Available</Label>
                      <Switch
                        id={`available-${meal.id}`}
                        checked={meal.available}
                        onCheckedChange={(checked) => handleToggleAvailability(meal.id, checked)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(meal)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(meal.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MealManagement;