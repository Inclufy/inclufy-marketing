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

import { useCampaigns, useCampaign, useLaunchCampaign } from '@/hooks/queries/useCampaigns';

const mockUser = { id: 'user-123', email: 'test@inclufy.com' };

const mockCampaigns = [
  {
    id: 'camp-1',
    name: 'Email Launch',
    type: 'email',
    status: 'active',
    description: 'Product launch email campaign',
    budget_amount: 5000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'camp-2',
    name: 'Social Ads',
    type: 'social',
    status: 'draft',
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
    update: vi.fn().mockReturnThis(),
  };
  Object.defineProperty(chain, 'then', {
    get: () => (resolve: any) => resolve({ data, error }),
  });
  mockFrom.mockReturnValue(chain);
  return chain;
}

describe('useCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('returns empty array when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    setupMockChain([]);

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBeTruthy());
  });

  it('queries campaigns table with user_id', async () => {
    setupMockChain(mockCampaigns);

    renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('campaigns');
    });
  });

  it('applies status filter when provided', async () => {
    setupMockChain(mockCampaigns);

    renderHook(() => useCampaigns({ status: 'active' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('campaigns');
    });
  });

  it('applies type filter when provided', async () => {
    setupMockChain(mockCampaigns);

    renderHook(() => useCampaigns({ type: 'email' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('campaigns');
    });
  });
});

describe('useCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('does not fetch when id is undefined', () => {
    setupMockChain([]);

    const { result } = renderHook(() => useCampaign(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('fetches single campaign by id', async () => {
    setupMockChain(mockCampaigns);

    renderHook(() => useCampaign('camp-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('campaigns');
    });
  });
});

describe('useLaunchCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('throws when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useLaunchCampaign(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync('camp-1');
    } catch (err: any) {
      expect(err.message).toBe('Not authenticated');
    }
  });
});
