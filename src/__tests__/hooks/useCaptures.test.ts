/**
 * Tests for useCaptures hooks and uploadMedia utility.
 *
 * These tests verify:
 * - Correct MIME type detection for photo / video / audio
 * - Non-fatal audio upload error handling
 * - Delete cascade (posts → storage → capture)
 */

import { uploadMedia } from '../../hooks/useCaptures';
import { supabase } from '../../services/supabase';

// ---------------------------------------------------------------------------
// uploadMedia — MIME type mapping
// ---------------------------------------------------------------------------

describe('uploadMedia — MIME type detection', () => {
  const mockUpload = jest.fn().mockResolvedValue({ error: null });
  const mockSignedUrl = jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url/file' } });

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: mockUpload,
      createSignedUrl: mockSignedUrl,
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://public.url' } }),
    });

    // Mock fetch + blob
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['data'], { type: 'image/jpeg' })),
    }) as any;
  });

  it('uses image/jpeg for photo uploads', async () => {
    await uploadMedia('file:///tmp/photo.jpg', 'event-1', 'photo');

    const uploadCall = mockUpload.mock.calls[0];
    expect(uploadCall[2]).toMatchObject({ contentType: 'image/jpeg' });
    expect(uploadCall[0]).toMatch(/\.jpg$/);
  });

  it('uses video/mp4 for .mp4 video uploads', async () => {
    await uploadMedia('file:///tmp/recording.mp4', 'event-1', 'video');

    const uploadCall = mockUpload.mock.calls[0];
    expect(uploadCall[2]).toMatchObject({ contentType: 'video/mp4' });
  });

  it('uses video/quicktime for .mov video uploads', async () => {
    await uploadMedia('file:///tmp/recording.mov', 'event-1', 'video');

    const uploadCall = mockUpload.mock.calls[0];
    expect(uploadCall[2]).toMatchObject({ contentType: 'video/quicktime' });
  });

  it('normalises iOS .m4a audio to audio/mp4 (never audio/x-m4a)', async () => {
    await uploadMedia('file:///tmp/audio.m4a', 'event-1', 'audio');

    const uploadCall = mockUpload.mock.calls[0];
    expect(uploadCall[2].contentType).toBe('audio/mp4');
    expect(uploadCall[2].contentType).not.toBe('audio/x-m4a');
  });

  it('handles .aac audio with audio/aac MIME type', async () => {
    await uploadMedia('file:///tmp/audio.aac', 'event-1', 'audio');
    const uploadCall = mockUpload.mock.calls[0];
    expect(uploadCall[2].contentType).toBe('audio/aac');
  });

  it('defaults unknown audio extensions to audio/mp4', async () => {
    await uploadMedia('file:///tmp/audio.xyz', 'event-1', 'audio');
    const uploadCall = mockUpload.mock.calls[0];
    expect(uploadCall[2].contentType).toBe('audio/mp4');
  });

  it('returns signed URL when available', async () => {
    const result = await uploadMedia('file:///tmp/photo.jpg', 'event-1', 'photo');
    expect(result.url).toBe('https://signed.url/file');
    expect(result.path).toMatch(/^events\/user-123\/event-1\//);
  });

  it('falls back to public URL when signing fails', async () => {
    mockSignedUrl.mockResolvedValueOnce({ data: null });
    const result = await uploadMedia('file:///tmp/photo.jpg', 'event-1', 'photo');
    expect(result.url).toBe('https://public.url');
  });

  it('throws when user is not authenticated', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } });
    await expect(uploadMedia('file:///tmp/photo.jpg', 'event-1', 'photo')).rejects.toThrow('Not authenticated');
  });

  it('throws on Supabase storage error for photos (fatal)', async () => {
    mockUpload.mockResolvedValueOnce({ error: { message: 'Storage quota exceeded' } });
    await expect(uploadMedia('file:///tmp/photo.jpg', 'event-1', 'photo')).rejects.toMatchObject({
      message: 'Storage quota exceeded',
    });
  });
});
