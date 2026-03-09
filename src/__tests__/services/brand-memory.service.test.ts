import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ select: mockSelect })) })) }));
const mockEq = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })) }));
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({ eq: mockEq })),
  insert: mockInsert,
  update: mockUpdate,
}));

const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// Import after mock
import { brandMemoryService, type BrandMemoryRow } from '@/services/brand/brand-memory.service';

const mockUser = { id: 'user-123', email: 'test@test.com' };

const mockBrandMemory: Partial<BrandMemoryRow> = {
  id: 'bm-1',
  user_id: 'user-123',
  brand_name: 'Test Brand',
  legal_name: 'Test Inc.',
  brand_description: 'A test brand',
  mission: 'To test',
  vision: 'Testing excellence',
  tagline: 'Test it right',
  elevator_pitch: 'We test things',
  positioning_statement: 'For testers',
  brand_values: ['quality', 'reliability'],
  brand_pillars: ['testing'],
  archetypes: ['hero'],
  industries: ['tech'],
  audiences: ['developers'],
  regions: ['global'],
  languages: ['en'],
  usps: ['best testing'],
  differentiators: ['speed'],
  proof_points: ['100% coverage'],
  tone_attributes: [{ attribute: 'professional', description: 'Always professional' }],
  messaging_dos: 'Be clear',
  messaging_donts: 'Be vague',
  preferred_vocabulary: ['innovative'],
  banned_phrases: ['literally'],
  compliance_rules: 'None',
  urls: ['https://test.com'],
  examples_good: 'This is great content',
  examples_poor: 'This is bad content',
  test_prompt: 'Write a test',
  competitors: [{ name: 'Rival', website: 'https://rival.com' }],
  marketing_goals: ['growth'],
  primary_color: '#7c3aed',
  secondary_color: '#ec4899',
  is_active: true,
  version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('BrandMemoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  describe('getOrCreateActive', () => {
    it('throws when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(brandMemoryService.getOrCreateActive()).rejects.toThrow('Not authenticated');
    });

    it('returns existing active brand memory', async () => {
      mockMaybeSingle.mockResolvedValue({ data: mockBrandMemory, error: null });

      const result = await brandMemoryService.getOrCreateActive();

      expect(result).toEqual(mockBrandMemory);
      expect(mockFrom).toHaveBeenCalledWith('brand_memory');
    });

    it('creates a new brand memory when none exists', async () => {
      // First call: no existing brand memory
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      // After insert: returns the new record
      mockSingle.mockResolvedValue({ data: mockBrandMemory, error: null });

      const result = await brandMemoryService.getOrCreateActive();

      expect(result).toEqual(mockBrandMemory);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('throws on Supabase select error', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      await expect(brandMemoryService.getOrCreateActive()).rejects.toEqual({ message: 'DB error' });
    });

    it('throws on Supabase insert error', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert error' } });

      await expect(brandMemoryService.getOrCreateActive()).rejects.toEqual({ message: 'Insert error' });
    });
  });

  describe('upsertActive', () => {
    it('throws when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(
        brandMemoryService.upsertActive({ brand_name: 'Updated' })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('snapshot', () => {
    it('throws when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(brandMemoryService.snapshot()).rejects.toThrow('Not authenticated');
    });
  });

  describe('BrandMemoryRow type coverage', () => {
    it('has all expected fields defined', () => {
      const row = mockBrandMemory as BrandMemoryRow;

      // Identity fields
      expect(row.brand_name).toBeDefined();
      expect(row.legal_name).toBeDefined();
      expect(row.brand_description).toBeDefined();
      expect(row.mission).toBeDefined();
      expect(row.vision).toBeDefined();
      expect(row.tagline).toBeDefined();
      expect(row.elevator_pitch).toBeDefined();
      expect(row.positioning_statement).toBeDefined();

      // Array fields
      expect(Array.isArray(row.brand_values)).toBe(true);
      expect(Array.isArray(row.brand_pillars)).toBe(true);
      expect(Array.isArray(row.archetypes)).toBe(true);
      expect(Array.isArray(row.industries)).toBe(true);
      expect(Array.isArray(row.audiences)).toBe(true);
      expect(Array.isArray(row.regions)).toBe(true);
      expect(Array.isArray(row.languages)).toBe(true);
      expect(Array.isArray(row.usps)).toBe(true);
      expect(Array.isArray(row.differentiators)).toBe(true);
      expect(Array.isArray(row.proof_points)).toBe(true);
      expect(Array.isArray(row.preferred_vocabulary)).toBe(true);
      expect(Array.isArray(row.banned_phrases)).toBe(true);
      expect(Array.isArray(row.urls)).toBe(true);
      expect(Array.isArray(row.competitors)).toBe(true);
      expect(Array.isArray(row.marketing_goals)).toBe(true);

      // Structured fields
      expect(Array.isArray(row.tone_attributes)).toBe(true);
      expect(row.tone_attributes[0]).toHaveProperty('attribute');
      expect(row.tone_attributes[0]).toHaveProperty('description');

      expect(row.competitors[0]).toHaveProperty('name');
      expect(row.competitors[0]).toHaveProperty('website');

      // Messaging fields (bridged from onboarding)
      expect(row.messaging_dos).toBeDefined();
      expect(row.messaging_donts).toBeDefined();

      // Color fields
      expect(row.primary_color).toBeDefined();
      expect(row.secondary_color).toBeDefined();

      // Meta fields
      expect(row.is_active).toBe(true);
      expect(row.version).toBe(1);
    });
  });
});
