const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `API error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[API Request Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),
  getSalesTrend: () => request('/dashboard/sales-trend'),
  getCategoryStats: () => request('/dashboard/category-stats'),
  getTopSelling: () => request('/dashboard/top-selling'),
  getAlerts: () => request('/dashboard/alerts'),

  // Medicines
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/medicines${query ? `?${query}` : ''}`);
  },
  getMedicineById: (id) => request(`/medicines/${id}`),
  addMedicine: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),
  adjustStock: (id, data) => request(`/medicines/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify(data) }),

  // Sales (POS)
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? `?${query}` : ''}`);
  },
  getSaleById: (id) => request(`/sales/${id}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),

  // Purchases (Inward Goods)
  getPurchases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/purchases${query ? `?${query}` : ''}`);
  },
  getPurchaseById: (id) => request(`/purchases/${id}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Stock Movements & Audit
  getMovements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/movements${query ? `?${query}` : ''}`);
  },
  getMovementStats: () => request('/movements/stats'),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  getSupplierById: (id) => request(`/suppliers/${id}`),
  addSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Admin / Reset Demo Data
  resetDatabase: () => request('/admin/reset', { method: 'POST' })
};

export default api;
