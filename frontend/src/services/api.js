import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
            headers: {
              'X-Refresh-Token': refreshToken,
              'Content-Type': 'application/json',
            },
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper to extract data from API response
const extractData = (response) => response.data.data;

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then(extractData),
  refreshToken: (token) => api.post('/auth/refresh', null, { headers: { 'X-Refresh-Token': token } }).then(extractData),
  getCurrentUser: () => api.get('/auth/me').then(extractData),
};

// Dashboard API
export const dashboardApi = {
  getSummary: (params) => api.get('/dashboard/summary', { params }).then(extractData),
  getNetMovementDetail: (params) => api.get('/dashboard/net-movement', { params }).then(extractData),
};

// Purchases API
export const purchasesApi = {
  getAll: (params) => api.get('/purchases', { params }).then(extractData),
  getById: (id) => api.get(`/purchases/${id}`).then(extractData),
  create: (data) => api.post('/purchases', data).then(extractData),
  update: (id, data) => api.put(`/purchases/${id}`, data).then(extractData),
  delete: (id) => api.delete(`/purchases/${id}`).then(extractData),
};

// Transfers API
export const transfersApi = {
  getAll: (params) => api.get('/transfers', { params }).then(extractData),
  getById: (id) => api.get(`/transfers/${id}`).then(extractData),
  create: (data) => api.post('/transfers', data).then(extractData),
  approve: (id) => api.post(`/transfers/${id}/approve`).then(extractData),
  receive: (id) => api.post(`/transfers/${id}/receive`).then(extractData),
  markInTransit: (id) => api.post(`/transfers/${id}/in-transit`).then(extractData),
  cancel: (id, reason) => api.post(`/transfers/${id}/cancel`, null, { params: { reason } }).then(extractData),
};

// Assignments API
export const assignmentsApi = {
  getAll: (params) => api.get('/assignments', { params }).then(extractData),
  getById: (id) => api.get(`/assignments/${id}`).then(extractData),
  create: (data) => api.post('/assignments', data).then(extractData),
  returnAsset: (id, returnedDate) => api.post(`/assignments/${id}/return`, null, { params: { returnedDate } }).then(extractData),
};

// Expenditures API
export const expendituresApi = {
  getAll: (params) => api.get('/expenditures', { params }).then(extractData),
  getById: (id) => api.get(`/expenditures/${id}`).then(extractData),
  create: (data) => api.post('/expenditures', data).then(extractData),
};

// Reference Data API
export const referenceApi = {
  getBases: () => api.get('/reference/bases').then(extractData),
  getEquipmentTypes: () => api.get('/reference/equipment-types').then(extractData),
  getPersonnel: (baseId) => api.get('/reference/personnel', { params: { baseId } }).then(extractData),
};

export const assetsApi = {
  getAll: (params) => api.get('/assets', { params }).then(extractData),
  getById: (id) => api.get(`/assets/${id}`).then(extractData),
};

// Audit Log API
export const auditLogApi = {
  getAll: (params) => api.get('/audit-logs', { params }).then(extractData),
};

export const getApiErrorMessage = (
  error,
  fallback = 'Something went wrong.'
) => {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    fallback
  );
};

export default api;