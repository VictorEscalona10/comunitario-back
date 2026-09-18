import axios from 'axios';

axios.defaults.withCredentials = true;

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';



export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial para enviar y recibir cookies HttpOnly (jwt_token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar respuestas y errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la sesión expiró (401) en endpoints protegidos que no sean el login/check
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/me')) {
      console.warn('Sesión no autorizada o expirada');
    }
    return Promise.reject(error);
  }
);
