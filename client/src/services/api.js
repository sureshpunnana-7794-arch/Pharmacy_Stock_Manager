import localStore from './localStore.js';

const API_BASE = '/api';

// Check if running on GitHub Pages or static host where no Node.js backend is attached
const isStaticDeployment = () => {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('github.io') ||
     window.location.hostname.includes('vercel.app') ||
     window.location.hostname.includes('netlify.app'))
  );
};

async function request(endpoint, options = {}, fallbackAction) {
  // If explicitly on GitHub Pages, use localStore directly for instant zero-latency response
  if (isStaticDeployment()) {
    return fallbackAction();
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`API returned status ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[API Fallback] Falling back to client-side store for ${endpoint}:`, err.message);
    return fallbackAction();
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () =>
    request('/dashboard/stats', {}, () => localStore.getDashboardStats()),
  getSalesTrend: () =>
    request('/dashboard/sales-trend', {}, () => localStore.getSalesTrend()),
  getCategoryStats: () =>
    request('/dashboard/category-stats', {}, () => localStore.getCategoryStats()),
  getTopSelling: () =>
    request('/dashboard/top-selling', {}, () => localStore.getTopSelling()),
  getAlerts: () =>
    request('/dashboard/alerts', {}, () => localStore.getAlerts()),

  // Medicines
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(
      `/medicines${query ? `?${query}` : ''}`,
      {},
      () => localStore.getMedicines(params)
    );
  },
  getMedicineById: (id) =>
    request(`/medicines/${id}`, {}, () => localStore.getMedicineById(id)),
  addMedicine: (data) =>
    request('/medicines', { method: 'POST', body: JSON.stringify(data) }, () =>
      localStore.addMedicine(data)
    ),
  updateMedicine: (id, data) =>
    request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () =>
      localStore.updateMedicine(id, data)
    ),
  deleteMedicine: (id) =>
    request(`/medicines/${id}`, { method: 'DELETE' }, () =>
      localStore.deleteMedicine(id)
    ),
  adjustStock: (id, data) =>
    request(
      `/medicines/${id}/adjust-stock`,
      { method: 'POST', body: JSON.stringify(data) },
      () => localStore.adjustStock(id, data)
    ),

  // Sales (POS)
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(
      `/sales${query ? `?${query}` : ''}`,
      {},
      () => localStore.getSales(params)
    );
  },
  createSale: (data) =>
    request('/sales', { method: 'POST', body: JSON.stringify(data) }, () =>
      localStore.createSale(data)
    ),

  // Purchases (Inward Goods)
  getPurchases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(
      `/purchases${query ? `?${query}` : ''}`,
      {},
      () => localStore.getPurchases(params)
    );
  },
  createPurchase: (data) =>
    request('/purchases', { method: 'POST', body: JSON.stringify(data) }, () =>
      localStore.createPurchase(data)
    ),

  // Stock Movements & Audit
  getMovements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(
      `/movements${query ? `?${query}` : ''}`,
      {},
      () => localStore.getMovements(params)
    );
  },
  getMovementStats: () =>
    request('/movements/stats', {}, () => localStore.getMovementStats()),

  // Suppliers
  getSuppliers: () =>
    request('/suppliers', {}, () => localStore.getSuppliers()),
  addSupplier: (data) =>
    request('/suppliers', { method: 'POST', body: JSON.stringify(data) }, () =>
      localStore.addSupplier(data)
    ),
  updateSupplier: (id, data) =>
    request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () =>
      localStore.updateSupplier(id, data)
    ),
  deleteSupplier: (id) =>
    request(`/suppliers/${id}`, { method: 'DELETE' }, () =>
      localStore.deleteSupplier(id)
    ),

  // Admin / Reset Demo Data
  resetDatabase: () =>
    request('/admin/reset', { method: 'POST' }, () =>
      localStore.resetDatabase()
    )
};

export default api;
