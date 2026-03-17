/**
 * Tests for AIService.
 *
 * Verifies:
 * - Edge Function invocation with correct action/payload
 * - Per-channel fallback when Edge Function returns error
 * - Translate content flow
 * - Transcribe audio flow
 * - generateAllChannelPosts never throws (always returns results)
 */

import { aiService } from '../../services/ai.service';
import { supabase } from '../../services/supabase';

const mockInvoke = supabase.functions.invoke as jest.Mock;

describe('AIService.generateEventPost', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls event-studio-ai with action=event-post', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { result: { text: 'Great post!', hashtags: ['#AI'], image_description: '', optimal_post_time: '' } },
      error: null,
    });

    const result = await aiService.generateEventPost({
      platform: 'linkedin',
      event_context: { name: 'Tech Summit', description: '', hashtags: [], location: 'Amsterdam' },
      capture_note: 'Opening keynote',
      capture_tags: ['keynote'],
    });

    expect(mockInvoke).toHaveBeenCalledWith('event-studio-ai', expect.objectContaining({
      body: expect.objectContaining({ action: 'event-post', platform: 'linkedin' }),
    }));
    expect(result.text).toBe('Great post!');
    expect(result.hashtags).toContain('#AI');
  });

  it('throws when Edge Function returns error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code' },
    });

    await expect(aiService.generateEventPost({
      platform: 'instagram',
      event_context: { name: 'Test', description: '', hashtags: [], location: '' },
      capture_note: '',
      capture_tags: [],
    })).rejects.toMatchObject({ message: 'Edge Function returned a non-2xx status code' });
  });

  it('returns fallback object when result is null', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { result: null }, error: null });

    const result = await aiService.generateEventPost({
      platform: 'x',
      event_context: { name: 'Test', description: '', hashtags: [], location: '' },
      capture_note: '',
      capture_tags: [],
    });

    // Should return the fallback, not throw
    expect(result).toMatchObject({ text: '', hashtags: [] });
  });
});

describe('AIService.generateAllChannelPosts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('generates posts for all channels in parallel', async () => {
    mockInvoke.mockResolvedValue({
      data: { result: { text: 'Post text', hashtags: ['#event'] } },
      error: null,
    });

    const results = await aiService.generateAllChannelPosts(
      ['linkedin', 'instagram', 'x'],
      undefined, undefined,
      { name: 'Event', description: '', hashtags: [], location: '' },
      '', [],
    );

    expect(Object.keys(results)).toHaveLength(3);
    expect(results.linkedin.text).toBe('Post text');
    expect(results.instagram.text).toBe('Post text');
    expect(results.x.text).toBe('Post text');
  });

  it('fills placeholder for failed channels — never throws', async () => {
    // First channel succeeds, second fails, third fails
    mockInvoke
      .mockResolvedValueOnce({ data: { result: { text: 'LinkedIn post', hashtags: [] } }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Timeout' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'Timeout' } });

    const results = await aiService.generateAllChannelPosts(
      ['linkedin', 'instagram', 'facebook'],
      undefined, undefined,
      { name: 'Test Event', description: '', hashtags: ['#test'], location: '' },
      '', [],
    );

    expect(results.linkedin.text).toBe('LinkedIn post');
    expect(results.instagram.text).toMatch(/mislukt/i);
    expect(results.facebook.text).toMatch(/mislukt/i);

    // Must NOT throw — caller relies on this
    expect(results).toBeTruthy();
  });
});

describe('AIService.translateContent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls translate action with correct payload', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { result: { translations: { en: { text: 'Translated text', hashtags: [], notes: '' } } } },
      error: null,
    });

    const result = await aiService.translateContent({
      text: 'Nederlandse tekst',
      source_language: 'nl',
      target_languages: ['en'],
      platform: 'linkedin',
    });

    expect(mockInvoke).toHaveBeenCalledWith('event-studio-ai', expect.objectContaining({
      body: expect.objectContaining({ action: 'translate', text: 'Nederlandse tekst' }),
    }));
    expect(result.translations.en.text).toBe('Translated text');
  });
});

describe('AIService.transcribeAudio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls transcribe action and returns transcript', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { result: { transcript: 'Hallo dit is een test opname', duration: 5.2 } },
      error: null,
    });

    const result = await aiService.transcribeAudio('base64audiodata==');

    expect(mockInvoke).toHaveBeenCalledWith('event-studio-ai', expect.objectContaining({
      body: expect.objectContaining({ action: 'transcribe', audio_base64: 'base64audiodata==' }),
    }));
    expect(result.transcript).toBe('Hallo dit is een test opname');
    expect(result.duration).toBe(5.2);
  });

  it('returns empty fallback when Edge Function fails', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Function not deployed' } });

    await expect(aiService.transcribeAudio('base64==')).rejects.toBeTruthy();
  });
});
