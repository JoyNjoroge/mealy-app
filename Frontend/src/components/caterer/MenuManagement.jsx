import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import apiService from '@/services/api';
import { toast } from '@/hooks/use-toast';

const MenuManagement = () => {
  const [meals, setMeals] = useState([]);
  const [todaysMenu, setTodaysMenu] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      const [mealsData, menuData] = await Promise.all([
        apiService.getMeals(),
        apiService.getTodaysMenu(),
      ]);
      
      setMeals(mealsData || []);
      setTodaysMenu(menuData.meals || []);
      
      // Set currently selected meals
      const currentMealIds = new Set(menuData.meals?.map(meal => meal.id) || []);
      setSelectedMeals(currentMealIds);
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealToggle = (mealId, checked) => {
    const newSelected = new Set(selectedMeals);
    if (checked) {
      newSelected.add(mealId);
    } else {
      newSelected.delete(mealId);
    }
    setSelectedMeals(newSelected);
  };

  const saveMenu = async () => {
    try {
      setIsSaving(true);
      const menuData = {
        date: new Date().toISOString().split('T')[0],
        meal_ids: Array.from(selectedMeals),
      };
      
      await apiService.createMenu(menuData);
      toast({
        title: "Menu updated!",
        description: "Today's menu has been updated successfully",
      });
      
      loadMenuData(); // Refresh data
    } catch (error) {
      console.error('Failed to save menu:', error);
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      {/* Current Menu Display */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📅</span>
            <span>Today's Menu</span>
          </CardTitle>
          <CardDescription>
            Current menu available for customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysMenu.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">📝</span>
              <p className="mt-2 text-muted-foreground">No menu set for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysMenu.map((meal) => (
                <div key={meal.id} className="p-4 border rounded-lg bg-muted/20">
                  <h3 className="font-medium">{meal.name}</h3>
                  <p className="text-sm text-muted-foreground">{meal.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary">₦{meal.price}</span>
                    <Badge variant="secondary">{meal.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Editor */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>✏️</span>
                <span>Update Menu</span>
              </CardTitle>
              <CardDescription>
                Select meals to include in today's menu
              </CardDescription>
            </div>
            <Button
              onClick={saveMenu}
              disabled={isSaving}
              className="bg-gradient-success hover:shadow-glow transition-smooth"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : 'Save Menu'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🍽️</span>
              <p className="mt-2 text-muted-foreground">
                No meals available. Create some meals first!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-smooth">
                  <Checkbox
                    id={`meal-${meal.id}`}
                    checked={selectedMeals.has(meal.id)}
                    onCheckedChange={(checked) => handleMealToggle(meal.id, checked)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`meal-${meal.id}`}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium">{meal.name}</h4>
                        <p className="text-sm text-muted-foreground">{meal.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-primary">₦{meal.price}</span>
                        <Badge variant="outline">{meal.category}</Badge>
                      </div>
                    </label>
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

export default MenuManagement;