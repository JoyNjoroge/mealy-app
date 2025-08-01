import { toast } from '@/hooks/use-toast';

class ApiService {
  constructor() {
    this.baseURL = 'https://mealy-backend-cjnv.onrender.com/api';
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
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format');
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
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

  // Auth
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' },
    });
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
    }
    return data;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Meals
  async getMeals() {
    const data = await this.request('/meals');
    return Array.isArray(data) ? data : [];
  }

  async getMyMeals() {
    const data = await this.request('/meals/my');
    return Array.isArray(data) ? data : [];
  }

  async createMeal(mealData) {
    const formData = new FormData();
    formData.append('name', mealData.name);
    formData.append('description', mealData.description);
    formData.append('price', mealData.price);
    if (mealData.image instanceof File) {
      formData.append('image', mealData.image);
    }
    if (mealData.caterer_id) {
      formData.append('caterer_id', mealData.caterer_id);
    }
    return this.request('/meals', {
      method: 'POST',
      body: formData,
      headers: { ...this.getAuthHeaders() },
    });
  }

  async updateMeal(mealId, mealData) {
    const submitData = { ...mealData };
    if (!mealData.image || !(mealData.image instanceof File)) {
      delete submitData.image;
    }
    return this.request(`/meals/${mealId}`, {
      method: 'PUT',
      body: JSON.stringify(submitData),
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
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
    return this.request('/menus', {
      method: 'POST',
      body: JSON.stringify(menuData),
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
    });
  }

  async deleteMenu(menuId) {
    return this.request(`/menus/${menuId}`, {
      method: 'DELETE',
      headers: { ...this.getAuthHeaders() },
    });
  }

  // Orders
  async getOrders() {
    const data = await this.request('/orders');
    return Array.isArray(data) ? data : [];
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
    });
  }

  async updateOrder(orderId, orderData) {
    return this.request(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
    });
  }

  async deleteOrder(orderId) {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
      headers: { ...this.getAuthHeaders() },
    });
  }

  async cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: { ...this.getAuthHeaders() },
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

  // Caterer-specific endpoints
  async getCatererMeals() {
    const data = await this.request('/caterer/meals');
    return Array.isArray(data) ? data : [];
  }

  async getCatererMenus() {
    const data = await this.request('/caterer/menus');
    return Array.isArray(data) ? data : [];
  }

  async getCatererOrders() {
    const data = await this.request('/caterer/orders');
    return Array.isArray(data) ? data : [];
  }

  async getCatererRevenue(date) {
    const endpoint = date ? `/caterer/revenue?date=${date}` : '/caterer/revenue';
    const data = await this.request(endpoint);
    // Return array of daily revenue data or single value if date specified
    return date ? (data.total_revenue || 0) : (data.daily_revenue || []);
  }

  async getCatererStats() {
    return this.request('/caterer/stats');
  }

  // New simplified meal system
  async getAvailableMeals() {
    const data = await this.request('/meals/available');
    return Array.isArray(data) ? data : [];
  }

  async toggleMealAvailability(mealId, available) {
    return this.request(`/meals/${mealId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ available }),
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
    });
  }
}

export default new ApiService();