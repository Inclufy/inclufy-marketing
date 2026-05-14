import axios from 'axios';
import { supabase } from './supabase';

// EXPO_PUBLIC_API_URL is REQUIRED in production builds (set via EAS Env
// Vars per build profile). The localhost fallback only kicks in during
// `__DEV__` runs (Expo Go on a phone behind the same wifi as Django dev
// server). In release builds we throw immediately on first request rather
// than silently calling localhost — a fail-fast for the hardcoded-scan
// finding flagged on 2026-05-14 audit.
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_BASE_URL = ENV_API_URL || (__DEV__ ? 'http://localhost:8000/api' : '');

if (!ENV_API_URL && !__DEV__) {
  // eslint-disable-next-line no-console
  console.error(
    '[api] EXPO_PUBLIC_API_URL is not set in this build. ' +
    'Django-backed endpoints (CopilotScreen, ContentCreator, OpportunityFeed, ' +
    'EventIntelligence) will fail. Configure in EAS → Project → Environment ' +
    'Variables → production profile.',
  );
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000, // 8s — fail fast when backend is unreachable
});

// Add auth token to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // No session available
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized — session may have expired');
    }
    return Promise.reject(error);
  },
);

export default api;
