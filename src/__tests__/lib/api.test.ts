import { describe, it, expect, vi } from 'vitest';

// Mock supabase before anything else
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

// vi.hoisted runs before vi.mock hoisting, so these are accessible
const { interceptorStore } = vi.hoisted(() => {
  const interceptorStore: {
    requestFn?: any;
    requestErrFn?: any;
    responseFn?: any;
    responseErrFn?: any;
  } = {};
  return { interceptorStore };
});

vi.mock('axios', () => {
  const mockInterceptors = {
    request: {
      use: vi.fn((fn: any, errFn: any) => {
        interceptorStore.requestFn = fn;
        interceptorStore.requestErrFn = errFn;
      }),
    },
    response: {
      use: vi.fn((fn: any, errFn: any) => {
        interceptorStore.responseFn = fn;
        interceptorStore.responseErrFn = errFn;
      }),
    },
  };
  const mockInstance = {
    interceptors: mockInterceptors,
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  };
});

// Import the module – triggers axios.create and interceptor registration
import axios from 'axios';
import { api } from '@/lib/api';

describe('API client', () => {
  it('creates axios instance with reduced timeout (5s) for fast failure', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 5000,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('registers request and response interceptors', () => {
    expect(api.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(api.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  describe('request interceptor', () => {
    it('adds authorization header when token exists in localStorage', async () => {
      localStorage.setItem('access_token', 'test-token-123');

      const config = { headers: {} as Record<string, string> };
      const result = await interceptorStore.requestFn(config);

      expect(result.headers.Authorization).toBe('Bearer test-token-123');
      localStorage.removeItem('access_token');
    });

    it('uses token from sessionStorage as fallback', async () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      sessionStorage.setItem('access_token', 'session-token-456');

      const config = { headers: {} as Record<string, string> };
      const result = await interceptorStore.requestFn(config);

      expect(result.headers.Authorization).toBe('Bearer session-token-456');
      sessionStorage.removeItem('access_token');
    });

    it('does not add authorization header when no token', async () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('access_token');

      const config = { headers: {} as Record<string, string> };
      const result = await interceptorStore.requestFn(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('passes through successful responses', () => {
      const response = { data: { ok: true }, status: 200 };
      const result = interceptorStore.responseFn(response);
      expect(result).toEqual(response);
    });

    it('returns empty array for GET requests on connection failure (graceful fallback)', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = {
        request: {},
        config: { method: 'get', url: '/test-endpoint' },
        message: 'Network Error',
      };

      const result = await interceptorStore.responseErrFn(error);

      expect(result.data).toEqual([]);
      expect(result.status).toBe(503);
      expect(result.statusText).toBe('Backend Unavailable');
      consoleSpy.mockRestore();
    });

    it('returns { ok: false } for POST requests on connection failure', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = {
        request: {},
        config: { method: 'post', url: '/test-endpoint' },
        message: 'Network Error',
      };

      const result = await interceptorStore.responseErrFn(error);

      expect(result.data).toEqual({ ok: false });
      expect(result.status).toBe(503);
      consoleSpy.mockRestore();
    });

    it('rejects on HTTP 401 errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = { response: { status: 401, data: {} } };

      await expect(interceptorStore.responseErrFn(error)).rejects.toEqual(error);
      consoleSpy.mockRestore();
    });

    it('rejects on HTTP 404 errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = { response: { status: 404, data: {} }, config: { url: '/missing' } };

      await expect(interceptorStore.responseErrFn(error)).rejects.toEqual(error);
      consoleSpy.mockRestore();
    });

    it('rejects on HTTP 500 errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = { response: { status: 500, data: {} }, config: { url: '/error' } };

      await expect(interceptorStore.responseErrFn(error)).rejects.toEqual(error);
      consoleSpy.mockRestore();
    });
  });
});
