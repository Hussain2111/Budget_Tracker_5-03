import axios from "axios";

const API_BASE_URL = "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url || "";

      if (status === 401) {
        const isAuthEndpoint = url.startsWith("/auth/login") || url.startsWith("/auth/register");

        if (!isAuthEndpoint) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          window.location.reload();
        }
      }

      return Promise.reject(error);
    },
);

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  profile: () => api.get("/auth/profile"),
};

// ... keep the rest of your services unchanged ...
export default api;

export const expenseService = {
  getAll: () => api.get('/expenses'),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const incomeService = {
  getAll: () => api.get('/income'),
  getOne: (id) => api.get(`/income/${id}`),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.patch(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
};

export const dashboardService = {
  summary: () => api.get('/dashboard/summary'),
  monthlySummary: (month, year) =>
      api.get('/dashboard/monthly-summary', { params: { month, year } }),

  expensesByCategory: (params) => api.get('/dashboard/expenses-by-category', { params }),
  incomeByCategory: (params) => api.get('/dashboard/income-by-category', { params }),

  monthlyHistory: (months = 12) => api.get('/dashboard/monthly-history', { params: { months } }),
};

export const ledgerService = {
  getAll: (params) => api.get('/ledger', { params }),
};

export const savingsService = {
  getAll: () => api.get('/savings'),
  getOne: (id) => api.get(`/savings/${id}`),
  create: (data) => api.post('/savings', data),
  update: (id, data) => api.patch(`/savings/${id}`, data),
  delete: (id) => api.delete(`/savings/${id}`),
  contribute: (id, data) => api.post(`/savings/${id}/contribute`, data),
};