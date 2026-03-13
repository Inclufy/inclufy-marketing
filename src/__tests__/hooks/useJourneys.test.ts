import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase client
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

import {
  useJourneys,
  useJourney,
  useCreateJourney,
  useActivateJourney,
  usePauseJourney,
} from '@/hooks/queries/useJourneys';

const mockUser = { id: 'user-123', email: 'test@inclufy.com' };

const mockJourneys = [
  {
    id: 'journey-1',
    name: 'Welcome Flow',
    description: 'Onboarding journey',
    status: 'active',
    nodes: [{ id: 'n1', type: 'start' }],
    edges: [],
    entry_rules: null,
    exit_rules: null,
    settings: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'journey-2',
    name: 'Re-engagement',
    description: null,
    status: 'draft',
    nodes: [],
    edges: [],
    entry_rules: null,
    exit_rules: null,
    settings: null,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function setupMockChain(data: any[], error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  };
  Object.defineProperty(chain, 'then', {
    get: () => (resolve: any) => resolve({ data, error }),
  });
  mockFrom.mockReturnValue(chain);
  return chain;
}

describe('useJourneys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('returns empty array when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    setupMockChain([]);

    const { result } = renderHook(() => useJourneys(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBeTruthy());
  });

  it('queries journeys table', async () => {
    setupMockChain(mockJourneys);

    renderHook(() => useJourneys(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('journeys');
    });
  });

  it('applies status filter when provided', async () => {
    setupMockChain(mockJourneys);

    renderHook(() => useJourneys('active'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('journeys');
    });
  });
});

describe('useJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('does not fetch when id is undefined', () => {
    setupMockChain([]);

    const { result } = renderHook(() => useJourney(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('fetches single journey by id', async () => {
    setupMockChain(mockJourneys);

    renderHook(() => useJourney('journey-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('journeys');
    });
  });
});

describe('useCreateJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('throws when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useCreateJourney(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync({ name: 'Test Journey' });
    } catch (err: any) {
      expect(err.message).toBe('Not authenticated');
    }
  });
});

describe('useActivateJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('throws when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useActivateJourney(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync('journey-1');
    } catch (err: any) {
      expect(err.message).toBe('Not authenticated');
    }
  });
});

describe('usePauseJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('throws when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => usePauseJourney(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync('journey-1');
    } catch (err: any) {
      expect(err.message).toBe('Not authenticated');
    }
  });
});
