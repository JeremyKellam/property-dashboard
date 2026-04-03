import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
});

API.interceptors.request.use((config) => {
  const key = localStorage.getItem('apiKey');
  if (key) config.headers['Authorization'] = `Bearer ${key}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('apiKey');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export const getRent = (params) => API.get('/rent', { params });
export const createRent = (data) => API.post('/rent', data);
export const payRent = (id, data) => API.post(`/rent/${id}/pay`, data);
export const applyLateFee = (id) => API.post(`/rent/${id}/late-fee`);
export const getPayments = (id) => API.get(`/rent/${id}/payments`);
export const deleteRent = (id) => API.delete(`/rent/${id}`);

export const getExpenses = (params) => API.get('/expenses', { params });
export const addExpense = (data) => API.post('/expenses', data);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

export const getTrips = (params) => API.get('/trips', { params });
export const getTripSummary = (params) => API.get('/trips/summary', { params });
export const addTrip = (data) => API.post('/trips', data);
export const deleteTrip = (id) => API.delete(`/trips/${id}`);

export const getMonthlySummary = (params) => API.get('/summary/monthly', { params });

export const exportToExcel = async (year) => {
  const params = year ? { year } : {};
  const res = await API.get('/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = year ? `property-dashboard-${year}.xlsx` : 'property-dashboard.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};
