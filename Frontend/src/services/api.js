class ApiService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiService = new ApiService();

// API endpoint helpers
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  profile: '/auth/profile',
  
  // Meals
  meals: '/meals',
  meal: (id) => `/meals/${id}`,
  
  // Menus
  menus: '/menus',
  todaysMenu: '/menus/today',
  menu: (id) => `/menus/${id}`,
  
  // Orders
  orders: '/orders',
  order: (id) => `/orders/${id}`,
  myOrders: '/orders/my',
  
  // Admin/Caterer specific
  allOrders: '/orders/all',
  revenue: '/orders/revenue',
  orderHistory: '/orders/history',
  
  // Notifications
  notifications: '/notifications',
  markNotificationRead: (id) => `/notifications/${id}/read`,
};