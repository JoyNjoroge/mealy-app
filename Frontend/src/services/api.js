import { toast } from '@/hooks/use-toast';

class ApiService {
  constructor() {
    this.baseURL = 'https://mealy-app-7r5n.onrender.com/api';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };
    // Only set Content-Type if body is a string (JSON)
    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }
    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      toast({
        title: "Request failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Meals
  async getMeals() {
    const data = await this.request('/meals');
    return Array.isArray(data.items) ? data.items : [];
  }

  async createMeal(mealData) {
    // Always use FormData for POST /meals
    const formData = new FormData();
    formData.append('name', mealData.name);
    formData.append('description', mealData.description);
    formData.append('price', mealData.price);
    formData.append('category', mealData.category || '');
    if (mealData.image instanceof File) {
      formData.append('image', mealData.image);
    }
    return this.request('/meals', {
      method: 'POST',
      body: formData,
      headers: { ...this.getAuthHeaders() }, // Do not set Content-Type
    });
  }

  async updateMeal(mealId, mealData) {
    // Always use FormData for PUT /meals/:id
    const formData = new FormData();
    formData.append('name', mealData.name);
    formData.append('description', mealData.description);
    formData.append('price', mealData.price);
    formData.append('category', mealData.category || '');
    if (mealData.image instanceof File) {
      formData.append('image', mealData.image);
    }
    return this.request(`/meals/${mealId}`, {
      method: 'PUT',
      body: formData,
      headers: { ...this.getAuthHeaders() },
    });
  }

  async deleteMeal(mealId) {
    return this.request(`/meals/${mealId}`, {
      method: 'DELETE',
      headers: { ...this.getAuthHeaders() },
    });
  }

  // Menu
  async getTodaysMenu() {
    return this.request('/menu/today');
  }

  async createMenu(menuData) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
  }

  // Orders
  async getOrders() {
    const data = await this.request('/orders');
    return Array.isArray(data.items) ? data.items : [];
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(orderId, orderData) {
    return this.request(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(orderId) {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  async getOrderHistory() {
    return this.request('/orders/history');
  }

  // Revenue
  async getDailyRevenue(date) {
    const data = await this.request(`/revenue/daily?date=${date}`);
    return data.total || 0;
  }

  // Auth
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}

export default new ApiService();