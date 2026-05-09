'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Trash2, Send, Calendar, Loader2, AlertCircle, CheckCircle2,
  Image as ImageIcon, Film, Hash, Sparkles, RefreshCw, Heart, MessageCircle,
  Share2, Copy as CopyIcon, ExternalLink, Plus, X, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useEventPost, useUpdatePost, usePublishPost, useDeletePost,
  useDuplicatePost, useFetchEngagement, useRewriteCaption, uploadPostMedia,
} from '@/hooks/useEventPosts';
import { createClient } from '@/lib/supabase';
import type { Channel } from '@/types';

/**
 * Capture-to-Ads bridge — when the Ads agent has produced a draft for this
 * post that's still awaiting approval, surface it as a banner so the user
 * can jump straight into the BoostFlow wizard with the recommended pacing
 * pre-filled.
 */
interface AdsAgentSuggestion {
  runId: string;
  budgetCents: number;
  days: number;
}

function useAdsAgentSuggestion(postId: string | undefined): AdsAgentSuggestion | null {
  const [suggestion, setSuggestion] = useState<AdsAgentSuggestion | null>(null);
  useEffect(() => {
    if (!postId) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('agent_runs')
          .select('id, output, agent:agents(kind)')
          .eq('related_post_id', postId)
          .eq('status', 'awaiting_approval')
          .limit(1)
          .maybeSingle();
        if (cancelled || !data) {
          if (!cancelled) setSuggestion(null);
          return;
        }
        const row = data as {
          id: string;
          output: Record<string, unknown> | null;
          agent: { kind?: string } | { kind?: string }[] | null;
        };
        const agent = Array.isArray(row.agent) ? row.agent[0] : row.agent;
        if (!agent || agent.kind !== 'ads') {
          if (!cancelled) setSuggestion(null);
          return;
        }
        const output = (row.output ?? {}) as Record<string, unknown>;
        const draft = (output.draft ?? {}) as Record<string, unknown>;
        const pacing = (draft.recommended_pacing ?? {}) as Record<string, unknown>;
        const dailyCapEur =
          typeof pacing.daily_cap_eur === 'number' ? pacing.daily_cap_eur : Number(pacing.daily_cap_eur);
        const days =
          typeof pacing.days === 'number' ? pacing.days : Number(pacing.days);
        if (!isFinite(dailyCapEur) || !isFinite(days) || dailyCapEur <= 0 || days <= 0) {
          if (!cancelled) setSuggestion(null);
          return;
        }
        if (!cancelled) {
          setSuggestion({
            runId: row.id,
            budgetCents: Math.round(dailyCapEur * days * 100),
            days: Math.round(days),
          });
        }
      } catch {
        if (!cancelled) setSuggestion(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);
  return suggestion;
}

const CHANNEL_LABEL: Record<Channel, string> = {
  linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', x: 'X',
};

const CHANNEL_COLOR: Record<Channel, string> = {
  linkedin: '#0A66C2', facebook: '#1877F2', instagram: '#E4405F', tiktok: '#000', x: '#000',
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: post, isLoading } = useEventPost(id);
  const adsSuggestion = useAdsAgentSuggestion(id);
  const update = useUpdatePost();
  const publish = usePublishPost();
  const del = useDeletePost();
  const duplicate = useDuplicatePost();
  const fetchEngagement = useFetchEngagement();
  const rewrite = useRewriteCaption();

  const [text, setText] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [scheduleInput, setScheduleInput] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState<'photo' | 'video' | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setText(post.text_content ?? '');
      setHashtags(post.hashtags ?? []);
      setScheduleInput(
        post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : '',
      );
    }
  }, [post?.id]);

  const dirty = useMemo(() => {
    if (!post) return false;
    if (text !== (post.text_content ?? '')) return true;
    if (JSON.stringify(hashtags) !== JSON.stringify(post.hashtags ?? [])) return true;
    return false;
  }, [post, text, hashtags]);

  const onSave = async () => {
    if (!post) return;
    try {
      await update.mutateAsync({ id: post.id, text_content: text, hashtags });
      toast.success('Opgeslagen');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onAddHashtag = () => {
    const v = hashtagInput.trim().replace(/^#+/, '');
    if (!v) return;
    setHashtags((h) => Array.from(new Set([...h, '#' + v])));
    setHashtagInput('');
  };

  const onRemoveHashtag = (tag: string) => {
    setHashtags((h) => h.filter((t) => t !== tag));
  };

  const onSchedule = async (offset?: '+1h' | '+1d' | '+1w' | 'clear' | 'custom') => {
    if (!post) return;
    let scheduled_at: string | null = null;
    if (offset === 'clear') {
      scheduled_at = null;
    } else if (offset === 'custom') {
      if (!scheduleInput) return;
      scheduled_at = new Date(scheduleInput).toISOString();
    } else {
      const d = new Date();
      if (offset === '+1h') d.setHours(d.getHours() + 1);
      if (offset === '+1d') d.setDate(d.getDate() + 1);
      if (offset === '+1w') d.setDate(d.getDate() + 7);
      scheduled_at = d.toISOString();
    }
    try {
      await update.mutateAsync({
        id: post.id,
        scheduled_at,
        status: scheduled_at ? 'scheduled' : 'draft',
      });
      toast.success(scheduled_at ? `Gepland voor ${new Date(scheduled_at).toLocaleString('nl-NL')}` : 'Planning verwijderd');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  /**
   * Capture-to-Ad — Boost handler.
   *
   * Navigates to the in-app BoostFlow wizard at /posts/{id}/boost.
   * The wizard handles budget/audience/variants/confirm in 4 steps and
   * creates the ad_campaigns row internally. User can still open Meta
   * Ads Manager from the wizard's final step if needed.
   */
  const onBoost = () => {
    if (!post) return;
    router.push(`/posts/${post.id}/boost`);
  };

  const onPublish = async () => {
    if (!post) return;
    if (dirty) {
      const ok = confirm('Niet-opgeslagen wijzigingen — eerst opslaan voor publiceren?');
      if (ok) await onSave();
    }
    try {
      const res = await publish.mutateAsync(post.id);
      if ('manual' in res && res.manual) {
        toast.success('Gepubliceerd (handmatig account — kopieer de tekst zelf)');
      } else if ('url' in res && res.url) {
        toast.success('Gepubliceerd!');
      } else {
        toast.success('Gepubliceerd!');
      }
    } catch (err: any) {
      const msg = err.message || 'Publiceren mislukt';
      if (msg.includes('SOCIAL_NOT_CONNECTED')) {
        toast.error(
          <span>
            Geen verbonden account —{' '}
            <Link href="/integrations" className="underline font-semibold">koppel eerst</Link>
          </span>,
          { duration: 6000 },
        );
      } else {
        toast.error(msg);
      }
    }
  };

  const onDelete = async () => {
    if (!post) return;
    if (!confirm('Deze post verwijderen?')) return;
    try {
      await del.mutateAsync(post.id);
      toast.info('Verwijderd');
      router.push('/posts');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onDuplicate = async () => {
    if (!post) return;
    try {
      const dup = await duplicate.mutateAsync(post);
      toast.success('Gedupliceerd');
      router.push(`/posts/${dup.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onRefreshEngagement = async () => {
    if (!post) return;
    try {
      const res = await fetchEngagement.mutateAsync(post.id);
      if (res.success && res.engagement) {
        toast.success(
          `❤ ${res.engagement.likes ?? 0} · 💬 ${res.engagement.comments ?? 0} · 🔁 ${res.engagement.shares ?? 0}`,
        );
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onRewrite = async () => {
    if (!post || !text.trim()) return;
    try {
      const newText = await rewrite.mutateAsync({ text, channel: post.channel });
      setText(newText);
      toast.success('AI heeft de tekst herschreven — opslaan om vast te leggen');
    } catch (err: any) {
      toast.error(err.message || 'AI rewrite mislukt');
    }
  };

  const onPickMedia = async (kind: 'photo' | 'video', file: File | null) => {
    if (!file || !post) return;
    setUploadingMedia(kind);
    try {
      const url = await uploadPostMedia(file, kind);
      if (kind === 'photo') {
        await update.mutateAsync({ id: post.id, branded_image_url: url });
        toast.success('Afbeelding bijgewerkt');
      } else {
        // Video field is not in PostUpdate type — store via raw update
        // But we don't have a dedicated mutator; cheat via supabase direct
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();
        const { error } = await supabase
          .from('go_posts')
          .update({ video_url: url, media_type: 'video' })
          .eq('id', post.id);
        if (error) throw error;
        toast.success('Video bijgewerkt — herlaad om te zien');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingMedia(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!post) return <div className="p-6">Post niet gevonden.</div>;

  const channelColor = CHANNEL_COLOR[post.channel] ?? '#64748b';
  const e = post.engagement ?? {};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/posts" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-xl font-bold truncate">Post bewerken</h1>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: channelColor + '18', color: channelColor }}
        >
          {CHANNEL_LABEL[post.channel] ?? post.channel}
        </span>
      </div>

      {/* Ads Agent suggestion bridge — appears when an ads agent run is awaiting
          approval for this post. Tapping the CTA jumps to BoostFlow with the
          agent's recommended pacing pre-filled. */}
      {adsSuggestion && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base">Ads Agent suggests boosting this post</p>
              <p className="text-sm text-white/90 leading-snug mt-0.5">
                Recommended budget €{Math.round(adsSuggestion.budgetCents / 100)} over {adsSuggestion.days} {adsSuggestion.days === 1 ? 'dag' : 'dagen'}.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/posts/${post.id}/boost?runId=${adsSuggestion.runId}&budget_cents=${adsSuggestion.budgetCents}&days=${adsSuggestion.days}`,
                )
              }
              className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-colors shrink-0"
            >
              Review suggestion
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="aspect-square w-full max-w-md mx-auto rounded-xl bg-slate-100 overflow-hidden relative group">
        {post.branded_image_url ? (
          <Image src={post.branded_image_url} alt="post preview" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ImageIcon className="h-16 w-16" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickMedia('photo', e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => photoRef.current?.click()}
            disabled={uploadingMedia === 'photo'}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow"
          >
            {uploadingMedia === 'photo' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
            Foto
          </button>
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => onPickMedia('video', e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => videoRef.current?.click()}
            disabled={uploadingMedia === 'video'}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow"
          >
            {uploadingMedia === 'video' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Film className="h-3 w-3" />}
            Video
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">Caption</label>
          <button
            onClick={onRewrite}
            disabled={rewrite.isPending || !text.trim()}
            className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
          >
            {rewrite.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI herschrijven
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Schrijf je post hier..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm leading-relaxed focus:border-pink-500 focus:outline-none"
        />
        <p className="text-xs text-slate-500">{text.length} tekens</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
          <Hash className="h-3.5 w-3.5" />
          Hashtags
        </label>
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700"
            >
              {tag}
              <button onClick={() => onRemoveHashtag(tag)} className="hover:text-pink-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddHashtag(); } }}
            placeholder="bijv. inclufy"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
          />
          <button
            onClick={onAddHashtag}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Toevoegen
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onSave}
          disabled={!dirty || update.isPending}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {dirty ? 'Wijzigingen opslaan' : 'Opgeslagen'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Plannen
        </h3>
        <div className="flex flex-wrap gap-2">
          {(['+1h', '+1d', '+1w'] as const).map((o) => (
            <button
              key={o}
              onClick={() => onSchedule(o)}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {o}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={scheduleInput}
            onChange={(e) => setScheduleInput(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
          />
          <button
            onClick={() => onSchedule('custom')}
            disabled={!scheduleInput}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Plan
          </button>
          {post.scheduled_at && (
            <button
              onClick={() => onSchedule('clear')}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Verwijder
            </button>
          )}
        </div>
        {post.scheduled_at && (
          <p className="text-xs text-blue-600">
            Gepland voor: {new Date(post.scheduled_at).toLocaleString('nl-NL')}
          </p>
        )}
      </div>

      <button
        onClick={onPublish}
        disabled={publish.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-base font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
      >
        {publish.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {publish.isPending ? 'Bezig met publiceren…' : 'Nu publiceren'}
      </button>

      {post.publish_error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Publiceren mislukt</p>
              <p className="mt-1 text-xs whitespace-pre-wrap">{post.publish_error}</p>
            </div>
          </div>
        </div>
      )}

      {post.status === 'published' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            Gepubliceerd
            {post.published_at && (
              <span className="font-normal text-emerald-700">
                · {new Date(post.published_at).toLocaleString('nl-NL')}
              </span>
            )}
            {post.published_post_id && (
              <a
                href={String(post.published_post_id)}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
              >
                Bekijk <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-emerald-900">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4" /> {e.likes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> {e.comments ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-4 w-4" /> {e.shares ?? 0}
            </span>
            <button
              onClick={onRefreshEngagement}
              disabled={fetchEngagement.isPending}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {fetchEngagement.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Vernieuwen
            </button>
          </div>
        </div>
      )}

      {/* Capture-to-Ad: Boost button on published Meta posts.
          Same pattern as mobile PostReviewScreen — fires boost-post edge fn
          (DRY-RUN until Meta App Review approves ads_management) +
          opens Meta Ads Manager with post pre-filled. */}
      {post.status === 'published' && (post.channel === 'facebook' || post.channel === 'instagram') && (
        <button
          onClick={onBoost}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-50 px-6 py-3 text-base font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <Sparkles className="h-5 w-5" />
          Boost deze post
          <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium">
            Capture-to-Ad
          </span>
        </button>
      )}

      <div className="flex justify-between gap-2 border-t border-slate-200 pt-4">
        <button
          onClick={onDuplicate}
          disabled={duplicate.isPending}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <CopyIcon className="h-4 w-4" />
          Dupliceren
        </button>
        <button
          onClick={onDelete}
          disabled={del.isPending}
          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Verwijderen
        </button>
      </div>
    </div>
  );
}
