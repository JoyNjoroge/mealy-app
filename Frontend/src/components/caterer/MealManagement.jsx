import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import apiService from '@/services/api';
import { toast } from '@/hooks/use-toast';

const MealManagement = ({ onStatsUpdate }) => {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getMeals();
      setMeals(data || []);
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!formData.image) delete submitData.image;
      if (editingMeal) {
        await apiService.updateMeal(editingMeal.id, submitData);
        toast({ title: "Meal updated successfully!" });
      } else {
        await apiService.createMeal(submitData);
        toast({ title: "Meal created successfully!" });
      }
      
      setIsDialogOpen(false);
      setEditingMeal(null);
      setFormData({ name: '', description: '', price: '', category: '', image: null });
      setImagePreview(null);
      loadMeals();
      onStatsUpdate && onStatsUpdate();
    } catch (error) {
      console.error('Failed to save meal:', error);
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      description: meal.description,
      price: meal.price.toString(),
      category: meal.category,
      image: null, // Don't prefill image
    });
    setImagePreview(meal.image_url || null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (mealId) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await apiService.deleteMeal(mealId);
        toast({ title: "Meal deleted successfully!" });
        loadMeals();
        onStatsUpdate && onStatsUpdate();
      } catch (error) {
        console.error('Failed to delete meal:', error);
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        image: file,
      });
      setImagePreview(file ? URL.createObjectURL(file) : null);
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

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
              <span>🍽️</span>
              <span>Meal Management</span>
            </CardTitle>
            <CardDescription>Create and manage your meal offerings</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow transition-smooth">
                Add New Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingMeal ? 'Edit Meal' : 'Add New Meal'}
                </DialogTitle>
                <DialogDescription>
                  {editingMeal ? 'Update meal details' : 'Create a new meal for your menu'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Meal Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Jollof Rice"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the meal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₦)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="e.g., Main Course, Appetizer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Meal Image</Label>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleChange}
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-2 w-full h-40 object-cover rounded-lg shadow-md border"
                      />
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" className="bg-gradient-primary">
                    {editingMeal ? 'Update Meal' : 'Create Meal'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!Array.isArray(meals) ? (
          <div className="text-center py-8 text-destructive">
            <span className="text-4xl">⚠️</span>
            <p className="mt-2">Failed to load meals. Please try again later.</p>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl">🍽️</span>
            <p className="mt-2 text-muted-foreground">No meals created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal) => (
              <Card key={meal.id} className="border hover:shadow-soft transition-smooth">
                <CardContent className="p-4">
                  {meal.image_url && (
                    <div className="w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={meal.image_url}
                        alt={meal.name}
                        className="object-cover w-full h-full rounded-lg shadow-md border"
                        style={{ maxHeight: '160px' }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{meal.name}</h3>
                    <Badge variant="secondary">{meal.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{meal.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-lg">₦{meal.price}</span>
                    <div className="space-x-2">
                      <Button
                        onClick={() => handleEdit(meal)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(meal.id)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MealManagement;