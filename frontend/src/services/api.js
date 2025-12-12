/**
 * API Service for ECH Simulator
 */

import axios from 'axios';

// Use relative URL in production (same origin), localhost in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Health check
export const healthCheck = () => api.get('/health');

// Scenarios
export const getScenarios = (category = null) => {
  const params = category ? { category } : {};
  return api.get('/scenarios', { params });
};

export const getScenarioDetail = (scenarioId) =>
  api.get(`/scenarios/${scenarioId}`);

// Simulation
export const runSimulation = (scenarioId, customParams = null) =>
  api.post(`/simulate/${scenarioId}`, { custom_params: customParams });

export const compareScenarios = (scenarioIds) =>
  api.post('/compare', { scenario_ids: scenarioIds });

export const runSensitivityAnalysis = (scenarioId, parameter, values) =>
  api.post('/sensitivity', { scenario_id: scenarioId, parameter, values });

// Data
export const getBaselineData = () => api.get('/baseline');

export const getPrices = (region = null, type = null) => {
  const params = {};
  if (region) params.region = region;
  if (type) params.type = type;
  return api.get('/prices', { params });
};

export const getCapacity = () => api.get('/capacity');

export const getOutages = (region = null) => {
  const params = region ? { region } : {};
  return api.get('/outages', { params });
};

export const getTradeData = () => api.get('/trade');

export const getCategories = () => api.get('/categories');

export const regenerateData = (startDate = null, periods = null) =>
  api.post('/regenerate', { start_date: startDate, periods });

export default api;