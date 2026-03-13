// src/lib/api.ts
// Legacy API client for admin/backend endpoints.
// Main app features now use Supabase directly.
// This client gracefully handles connection errors when the backend is unavailable.

import axios from 'axios';
import { supabase } from '@/lib/supabase/client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // Reduced timeout — fail fast when backend is unavailable
});

// Request interceptor - add Supabase auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        return config;
      }
    } catch {
      // Supabase not available, fall through
    }

    const token = localStorage.getItem('access_token') ||
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — gracefully handle connection errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Connection refused / network error → return empty data instead of crashing
    if (!error.response && error.request) {
      console.warn(`[API] Backend unavailable for ${error.config?.url || 'unknown'} — returning empty data`);
      return {
        data: error.config?.method === 'get' ? [] : { ok: false },
        status: 503,
        statusText: 'Backend Unavailable',
        headers: {},
        config: error.config,
      };
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 401) console.warn('[API] Unauthorized');
      else if (status === 403) console.warn('[API] Forbidden');
      else if (status === 404) console.warn('[API] Not found:', error.config?.url);
      else console.warn('[API] Error', status, error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default api;
