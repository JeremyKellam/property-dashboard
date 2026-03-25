import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
});

export const getRent = (params) => API.get('/rent', { params });
export const createRent = (data) => API.post('/rent', data);
export const payRent = (id, data) => API.post(`/rent/${id}/pay`, data);
export const applyLateFee = (id) => API.post(`/rent/${id}/late-fee`);
export const getPayments = (id) => API.get(`/rent/${id}/payments`);

export const getExpenses = (params) => API.get('/expenses', { params });
export const addExpense = (data) => API.post('/expenses', data);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

export const getTrips = (params) => API.get('/trips', { params });
export const getTripSummary = (params) => API.get('/trips/summary', { params });
export const addTrip = (data) => API.post('/trips', data);
export const deleteTrip = (id) => API.delete(`/trips/${id}`);

export const getMonthlySummary = (params) => API.get('/summary/monthly', { params });
