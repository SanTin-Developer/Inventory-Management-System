import api from "./api";

// Dashboard API-Endpoint
export const dashboardApi = {
  get: () => api.get("/dashboard"),
};

// Auth API-Endpoint
export const authApi = {
  login: (email, password) => api.post("/login", { email, password }),
  logout: () => api.post("/logout"),
  me: () => api.get("/me"),
};

//Products (getX convention — used by ProductList.jsx)
export const productService = {
  async getProducts(params = {}) {
    const response = await api.get("/products", { params });
    return response.data;
  },
  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  async createProduct(payload) {
    const response = await api.post("/products", payload);
    return response.data;
  },
  async updateProduct(id, payload) {
    const response = await api.put(`/products/${id}`, payload);
    return response.data;
  },
  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  };

// Products (list/get convention — used by Purchases.jsx etc.)
export const productsApi = {
  list: (params) => api.get("/products", { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post("/products", payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
};

//  Reports
export const reportsApi = {
  salesSummary: (params) => api.get("/reports/sales-summary", { params }),
  sales: (params) => api.get("/reports/sales-summary", { params }), // alias used by Reports.jsx

  purchaseSummary: (params) => api.get("/reports/purchase-summary", { params }),

  inventory: (params) => api.get("/reports/inventory", { params }),
  inventoryValue: (params) => api.get("/reports/inventory", { params }), // alias used by Reports.jsx

  topProducts: (params) => api.get("/reports/top-products", { params }),
  slowMoving: (params) => api.get("/reports/slow-moving", { params }),
};

//  Categories
export const categoriesApi = {
  list: (params) => api.get("/categories", { params }),
  listAll: () => api.get("/categories", { params: { all: true } }),
  get: (id) => api.get(`/categories/${id}`),
  create: (payload) => api.post("/categories", payload),
  update: (id, payload) => api.put(`/categories/${id}`, payload),
  remove: (id) => api.delete(`/categories/${id}`),
};

// Suppliers
export const suppliersApi = {
  list: (params) => api.get("/suppliers", { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (payload) => api.post("/suppliers", payload),
  update: (id, payload) => api.put(`/suppliers/${id}`, payload),
  remove: (id) => api.delete(`/suppliers/${id}`),
};

// Purchases
export const purchasesApi = {
  list: (params) => api.get("/purchases", { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (payload) => api.post("/purchases", payload),
  update: (id, payload) => api.put(`/purchases/${id}`, payload),
  remove: (id) => api.delete(`/purchases/${id}`),
};

//  Sales
export const salesApi = {
  list: (params) => api.get("/sales", { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (payload) => api.post("/sales", payload),
  update: (id, payload) => api.put(`/sales/${id}`, payload),
  remove: (id) => api.delete(`/sales/${id}`),
};

// Stock History
export const stockHistoryApi = {
  list: (params) => api.get("/stock-histories", { params }),
  get: (id) => api.get(`/stock-histories/${id}`),
};

// Users (Admin only)
//Roles
export const rolesApi = {
  list: (params) => api.get("/roles", { params }),
  get: (id) => api.get(`/roles/${id}`),
  create: (payload) => api.post("/roles", payload),
  update: (id, payload) => api.put(`/roles/${id}`, payload),
  remove: (id) => api.delete(`/roles/${id}`),
};

//Departments
export const departmentsApi = {
  list: (params) => api.get("/departments", { params }),
  get: (id) => api.get(`/departments/${id}`),
  create: (payload) => api.post("/departments", payload),
  update: (id, payload) => api.put(`/departments/${id}`, payload),
  remove: (id) => api.delete(`/departments/${id}`),
};

// Users (add updateForm to your EXISTING usersApi block)
export const usersApi = {
  list: (params) => api.get("/users", { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post("/users", payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),

  verifyPassword: (id, payload) =>
    api.post(`/users/${id}/verify-password`, payload),

  updateForm: (id, formData) => {
    formData.append("_method", "PUT");
    return api.post(`/users/${id}`, formData);
  },

  remove: (id) => api.delete(`/users/${id}`),
};

export const customersApi = {
  list: (params) => api.get("/customers", { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (payload) => api.post("/customers", payload),
  update: (id, payload) => api.put(`/customers/${id}`, payload),
  remove: (id) => api.delete(`/customers/${id}`),
};

// Audit Log (read-only)
export const auditLogApi = {
  list: (params) => api.get("/audit-logs", { params }),
  get: (id) => api.get(`/audit-logs/${id}`),
};
