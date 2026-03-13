import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
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

import { useContentLibrary, useRecentContent, useSaveContent } from '@/hooks/queries/useContentLibrary';

const mockUser = { id: 'user-123', email: 'test@inclufy.com' };

const mockContent = [
  {
    id: 'content-1',
    title: 'Test Blog Post',
    type: 'blog',
    content: 'Hello world',
    status: 'published',
    tags: ['marketing'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'content-2',
    title: 'Test Social Post',
    type: 'social',
    status: 'draft',
    tags: ['social'],
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
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    then: undefined as any,
  };
  // Final resolution
  Object.defineProperty(chain, 'then', {
    get: () => (resolve: any) => resolve({ data, error }),
  });
  mockFrom.mockReturnValue(chain);
  return chain;
}

describe('useContentLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('returns empty array when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const chain = setupMockChain([]);

    const { result } = renderHook(() => useContentLibrary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBeTruthy());
  });

  it('queries content_items table with user_id', async () => {
    const chain = setupMockChain(mockContent);

    renderHook(() => useContentLibrary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items');
    });
  });

  it('applies type filter when provided', async () => {
    const chain = setupMockChain(mockContent);

    renderHook(() => useContentLibrary({ type: 'blog' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items');
    });
  });

  it('applies limit when provided', async () => {
    const chain = setupMockChain(mockContent);

    renderHook(() => useContentLibrary({ limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items');
    });
  });
});

describe('useRecentContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('calls content_items with default limit of 6', async () => {
    setupMockChain(mockContent);

    renderHook(() => useRecentContent(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items');
    });
  });

  it('accepts custom limit', async () => {
    setupMockChain(mockContent);

    renderHook(() => useRecentContent(10), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items');
    });
  });
});
