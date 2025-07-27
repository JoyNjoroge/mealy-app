import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/common/Loading";
import { apiService, endpoints } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Meal {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

interface MealFormProps {
  meal?: Meal;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const mealCategories = [
  "Main Course",
  "Appetizer",
  "Dessert",
  "Beverage",
  "Salad",
  "Soup",
  "Snack",
  "Breakfast",
  "Vegetarian",
  "Vegan"
];

export const MealForm: React.FC<MealFormProps> = ({ 
  meal, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<Meal>({
    name: meal?.name || "",
    description: meal?.description || "",
    price: meal?.price || 0,
    category: meal?.category || "",
    image_url: meal?.image_url || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      if (meal?.id) {
        // Update existing meal
        await apiService.put(endpoints.meal(meal.id), formData);
        toast({
          title: "Meal updated!",
          description: "Your meal has been updated successfully.",
        });
      } else {
        // Create new meal
        await apiService.post(endpoints.meals, formData);
        toast({
          title: "Meal created!",
          description: "Your new meal has been added successfully.",
        });
      }
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "",
        image_url: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save meal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof Meal, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{meal?.id ? "Edit Meal" : "Add New Meal"}</DialogTitle>
          <DialogDescription>
            {meal?.id ? "Update your meal details" : "Create a new meal for your menu"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Meal Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Grilled Chicken Salad"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your meal..."
              rows={3}
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {mealCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
              placeholder="https://example.com/meal-image.jpg"
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.description}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : meal?.id ? (
                "Update Meal"
              ) : (
                "Create Meal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};