import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useMarketingStrategy, MarketingStrategy, ChannelConfig, useUpdateMarketingStrategy } from './useMarketingStrategy';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export interface ContentProposal {
  id: string;
  user_id: string;
  title: string;
  content_text: string;
  content_type: 'social' | 'caption' | 'blog' | 'email' | 'ad';
  channel: string;
  scheduled_for: string | null;
  based_on: {
    strategy_goal?: string;
    content_mix_type?: string;
    product_id?: string;
    product_name?: string;
    team_member_id?: string;
    team_member_name?: string;
    trigger?: string;
  };
  hashtags: string[];
  media_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published' | 'expired';
  reviewed_at: string | null;
  review_note: string | null;
  tone: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalStats {
  pending: number;
  approved: number;
  rejected: number;
  scheduled: number;
  published: number;
  total: number;
}

// ═══════════════════════════════════════════════════════
// CRUD Hooks
// ═══════════════════════════════════════════════════════

export function useContentProposals(statusFilter?: string) {
  return useQuery<ContentProposal[]>({
    queryKey: ['content-proposals', statusFilter ?? 'all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      let query = supabase
        .from('go_content_proposals')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true, nullsFirst: false });
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) { console.warn('[useContentProposals] error:', error.message); return []; }
      return (data ?? []) as ContentProposal[];
    },
    staleTime: 15_000,
  });
}

export function useProposalStats() {
  return useQuery<ProposalStats>({
    queryKey: ['proposal-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { pending: 0, approved: 0, rejected: 0, scheduled: 0, published: 0, total: 0 };
      const { data, error } = await supabase
        .from('go_content_proposals')
        .select('status')
        .eq('user_id', user.id);
      if (error || !data) return { pending: 0, approved: 0, rejected: 0, scheduled: 0, published: 0, total: 0 };
      const counts = { pending: 0, approved: 0, rejected: 0, scheduled: 0, published: 0, total: data.length };
      data.forEach((p: any) => {
        if (p.status in counts) (counts as any)[p.status]++;
      });
      return counts;
    },
    staleTime: 15_000,
  });
}

// ═══════════════════════════════════════════════════════
// Trust Score & Autonomy
// ═══════════════════════════════════════════════════════

const TRUST_THRESHOLD = 5; // successful publications needed per channel to unlock auto-publish

export interface ChannelTrust {
  channel: string;
  publishedCount: number;
  rejectedCount: number;
  trustReady: boolean; // >= TRUST_THRESHOLD successful publications
  trustScore: number;  // 0-100
}

export interface TrustOverview {
  channels: ChannelTrust[];
  overallScore: number;        // 0-100 average across active channels
  autoPublishReady: boolean;   // all active channels above threshold
  totalPublished: number;
  totalRejected: number;
}

export function useTrustScore() {
  const { data: strategy } = useMarketingStrategy();
  return useQuery<TrustOverview>({
    queryKey: ['trust-score'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { channels: [], overallScore: 0, autoPublishReady: false, totalPublished: 0, totalRejected: 0 };

      // Fetch all published and rejected proposals grouped by channel
      const { data: proposals } = await supabase
        .from('go_content_proposals')
        .select('channel, status')
        .eq('user_id', user.id)
        .in('status', ['published', 'rejected']);

      const channelCounts: Record<string, { published: number; rejected: number }> = {};
      (proposals ?? []).forEach((p: any) => {
        if (!channelCounts[p.channel]) channelCounts[p.channel] = { published: 0, rejected: 0 };
        if (p.status === 'published') channelCounts[p.channel].published++;
        if (p.status === 'rejected') channelCounts[p.channel].rejected++;
      });

      // Build per-channel trust
      const activeChannels = strategy?.channels
        ? Object.entries(strategy.channels).filter(([_, c]) => (c as ChannelConfig).active).map(([k]) => k)
        : Object.keys(channelCounts);

      const channels: ChannelTrust[] = activeChannels.map((ch) => {
        const counts = channelCounts[ch] || { published: 0, rejected: 0 };
        const total = counts.published + counts.rejected;
        const successRate = total > 0 ? counts.published / total : 0;
        const progressToThreshold = Math.min(counts.published / TRUST_THRESHOLD, 1);
        const trustScore = Math.round(progressToThreshold * 70 + successRate * 30); // 70% volume, 30% quality
        return {
          channel: ch,
          publishedCount: counts.published,
          rejectedCount: counts.rejected,
          trustReady: counts.published >= TRUST_THRESHOLD,
          trustScore,
        };
      });

      const totalPublished = channels.reduce((s, c) => s + c.publishedCount, 0);
      const totalRejected = channels.reduce((s, c) => s + c.rejectedCount, 0);
      const overallScore = channels.length > 0
        ? Math.round(channels.reduce((s, c) => s + c.trustScore, 0) / channels.length)
        : 0;
      const autoPublishReady = channels.length > 0 && channels.every((c) => c.trustReady);

      return { channels, overallScore, autoPublishReady, totalPublished, totalRejected };
    },
    staleTime: 30_000,
  });
}

export { TRUST_THRESHOLD };

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentProposal> & { id: string }) => {
      const { data, error } = await supabase
        .from('go_content_proposals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ContentProposal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-proposals'] });
      qc.invalidateQueries({ queryKey: ['proposal-stats'] });
    },
  });
}

export function useApproveProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data, error } = await supabase
        .from('go_content_proposals')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_note: note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ContentProposal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-proposals'] });
      qc.invalidateQueries({ queryKey: ['proposal-stats'] });
    },
  });
}

export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data, error } = await supabase
        .from('go_content_proposals')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          review_note: note || 'Afgewezen',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ContentProposal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-proposals'] });
      qc.invalidateQueries({ queryKey: ['proposal-stats'] });
    },
  });
}

export function useDeleteProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('go_content_proposals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-proposals'] });
      qc.invalidateQueries({ queryKey: ['proposal-stats'] });
    },
  });
}

// ═══════════════════════════════════════════════════════
// Publish to Social Media
// ═══════════════════════════════════════════════════════

export interface PublishResult {
  success: boolean;
  published?: boolean;
  manual?: boolean;
  channel?: string;
  postId?: string;
  message?: string;
  error?: string;
  action?: string;
}

export function usePublishProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: string): Promise<PublishResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpxkugfqzmxydxnlxqoj.supabase.co';
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${supabaseUrl}/functions/v1/publish-social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          proposal_id: proposalId,
          user_id: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw Object.assign(new Error(data.error || 'Publicatie mislukt'), { data });
      }

      return data as PublishResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-proposals'] });
      qc.invalidateQueries({ queryKey: ['proposal-stats'] });
      qc.invalidateQueries({ queryKey: ['automation-logs'] });
      qc.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

// ═══════════════════════════════════════════════════════
// Content Generator
// ═══════════════════════════════════════════════════════

const CONTENT_TEMPLATES: Record<string, Array<(ctx: any) => { title: string; text: string; hashtags: string[] }>> = {
  educational: [
    (ctx) => ({
      title: `Tip: ${ctx.product?.name || ctx.org?.company_name || 'Marketing'}`,
      text: `💡 Wist je dat ${ctx.product?.name || 'onze oplossing'} ${ctx.product?.usps?.[0] || 'je bedrijf naar een hoger niveau tilt'}?\n\n${ctx.product?.description || ctx.org?.elevator_pitch || 'Ontdek hoe wij bedrijven helpen groeien.'}\n\nMeer weten? Neem contact op! 👇`,
      hashtags: ['#marketing', '#tip', '#groei', `#${(ctx.org?.company_name || 'business').toLowerCase().replace(/\s/g, '')}`],
    }),
    (ctx) => ({
      title: `Inzicht: ${ctx.org?.industry || 'De markt'}`,
      text: `📊 In de wereld van ${ctx.org?.industry || 'B2B marketing'} zien we een verschuiving.\n\nBedrijven zoals ${ctx.org?.company_name || 'het onze'} investeren steeds meer in ${ctx.product?.category === 'service' ? 'dienstverlening' : 'innovatieve producten'}.\n\nWat is jouw ervaring? Deel het in de comments! 💬`,
      hashtags: ['#insight', '#trends', `#${(ctx.org?.industry || 'business').toLowerCase().replace(/\s/g, '')}`],
    }),
  ],
  promotional: [
    (ctx) => {
      const name = ctx.product?.name || ctx.org?.company_name || 'onze oplossing';
      return {
        title: `Ontdek ${name}`,
        text: `🚀 ${name} — ${ctx.product?.description || ctx.org?.tagline || 'de oplossing die je nodig hebt'}.\n\n${ctx.product?.usps?.map((u: string) => `✅ ${u}`).join('\n') || '✅ Bewezen resultaten\n✅ Persoonlijke aanpak'}\n\n${ctx.product?.price ? `Vanaf ${ctx.product.price}` : 'Vraag een demo aan!'} 🎯`,
        hashtags: ['#nieuw', '#launch', `#${name.toLowerCase().replace(/\s/g, '')}`],
      };
    },
  ],
  behind_scenes: [
    (ctx) => ({
      title: `Meet the team: ${ctx.member?.name || 'Ons team'}`,
      text: `👋 Maak kennis met ${ctx.member?.name || 'een van onze teamleden'}, ${ctx.member?.role || 'specialist'} bij ${ctx.org?.company_name || 'ons bedrijf'}.\n\n${ctx.member?.bio || `Met expertise in ${ctx.member?.expertise?.join(', ') || 'marketing & strategie'}, werkt ${ctx.member?.name?.split(' ')[0] || 'het team'} dagelijks aan de beste resultaten voor onze klanten.`}\n\n#teamwork #behindthescenes`,
      hashtags: ['#team', '#behindthescenes', '#werkenbij', `#${(ctx.org?.company_name || 'team').toLowerCase().replace(/\s/g, '')}`],
    }),
  ],
  thought_leadership: [
    (ctx) => ({
      title: `Visie: ${ctx.org?.company_name || 'Onze kijk'}`,
      text: `🎯 ${ctx.org?.elevator_pitch || `Bij ${ctx.org?.company_name || 'ons bedrijf'} geloven we in de kracht van slimme marketing.`}\n\nDe toekomst van ${ctx.org?.industry || 'onze sector'} ligt in personalisatie, data-driven beslissingen en authentieke verbinding met je doelgroep.\n\nWat denk jij? Waar gaat de markt naartoe? 🤔`,
      hashtags: ['#thoughtleadership', '#visie', '#toekomst', `#${(ctx.org?.industry || 'business').toLowerCase().replace(/\s/g, '')}`],
    }),
  ],
  user_generated: [
    (ctx) => ({
      title: `Klantervaring`,
      text: `⭐ Onze klanten aan het woord!\n\n"Dankzij ${ctx.org?.company_name || 'het team'} hebben we onze ${ctx.product?.category === 'service' ? 'processen' : 'resultaten'} significant verbeterd."\n\nBenieuwd wat we voor jou kunnen betekenen? Link in bio! 🔗`,
      hashtags: ['#klantverhaal', '#testimonial', '#resultaten'],
    }),
  ],
};

const DAY_NAMES_NL: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
  friday: 5, saturday: 6, sunday: 0,
  // Short Dutch names (used by mobile strategy config)
  ma: 1, di: 2, wo: 3, do: 4, vr: 5, za: 6, zo: 0,
  // Short English names
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

function getNextDateForDay(dayName: string, weekOffset: number = 0): Date {
  const dayNum = DAY_NAMES_NL[dayName.toLowerCase()] ?? 1;
  const now = new Date();
  const currentDay = now.getDay();
  let daysAhead = dayNum - currentDay;
  if (daysAhead <= 0) daysAhead += 7;
  daysAhead += weekOffset * 7;
  const date = new Date(now);
  date.setDate(date.getDate() + daysAhead);
  return date;
}

function pickWeighted(mix: Record<string, number>): string {
  const entries = Object.entries(mix).filter(([_, v]) => v > 0);
  if (entries.length === 0) return 'educational';
  const total = entries.reduce((sum, [_, v]) => sum + v, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return entries[0][0];
}

export function useGenerateProposals() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // 1. Fetch strategy
      const { data: strategy } = await supabase
        .from('go_marketing_strategy')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!strategy) throw new Error('Stel eerst je Marketing Strategie in');

      // 2. Fetch context
      const [productsRes, orgRes, teamRes] = await Promise.all([
        supabase.from('go_products').select('*').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('go_organization').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('go_team_directory').select('*').eq('user_id', user.id).eq('is_active', true),
      ]);
      const products = productsRes.data ?? [];
      const org = orgRes.data;
      const team = teamRes.data ?? [];

      // 3. Determine active channels
      const channels = (strategy.channels || {}) as Record<string, ChannelConfig>;
      const activeChannels = Object.entries(channels)
        .filter(([_, cfg]) => cfg.active)
        .map(([name]) => name);
      if (activeChannels.length === 0) activeChannels.push('linkedin');

      // 4. Determine posting days
      const postingDays = (strategy.posting_days || ['monday', 'wednesday', 'friday']) as string[];
      const contentMix = (strategy.content_mix || { educational: 30, promotional: 25, behind_scenes: 20, thought_leadership: 15, user_generated: 10 }) as Record<string, number>;
      const postingTimes = (strategy.posting_times || { morning: '09:00' }) as Record<string, string>;
      const defaultTime = postingTimes.morning || postingTimes.afternoon || '09:00';

      // 5. Check how many proposals already exist for this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: existingProposals } = await supabase
        .from('go_content_proposals')
        .select('id')
        .eq('user_id', user.id)
        .gte('scheduled_for', weekStart.toISOString())
        .lt('scheduled_for', weekEnd.toISOString())
        .in('status', ['pending', 'approved', 'scheduled']);

      const existingCount = existingProposals?.length ?? 0;
      const targetCount = strategy.posts_per_week || 3;
      const toGenerate = Math.max(0, targetCount - existingCount);

      if (toGenerate === 0) {
        // Generate for next week instead
        return generateForDays(user.id, postingDays, activeChannels, contentMix, defaultTime, products, org, team, strategy, 1);
      }

      return generateForDays(user.id, postingDays, activeChannels, contentMix, defaultTime, products, org, team, strategy, 0);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-proposals'] });
      qc.invalidateQueries({ queryKey: ['proposal-stats'] });
    },
  });
}

async function generateForDays(
  userId: string,
  postingDays: string[],
  activeChannels: string[],
  contentMix: Record<string, number>,
  defaultTime: string,
  products: any[],
  org: any,
  team: any[],
  strategy: any,
  weekOffset: number,
) {
  const proposals: Partial<ContentProposal>[] = [];
  let channelIdx = 0;

  for (const day of postingDays) {
    const channel = activeChannels[channelIdx % activeChannels.length];
    channelIdx++;

    const mixType = pickWeighted(contentMix);
    const templates = CONTENT_TEMPLATES[mixType] || CONTENT_TEMPLATES.educational;
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Pick random context item
    const product = products.length > 0 ? products[Math.floor(Math.random() * products.length)] : null;
    const member = team.length > 0 ? team[Math.floor(Math.random() * team.length)] : null;

    const ctx = { product, org, member, strategy };
    const generated = template(ctx);

    const scheduledDate = getNextDateForDay(day, weekOffset);
    const [hours, mins] = defaultTime.split(':').map(Number);
    scheduledDate.setHours(hours || 9, mins || 0, 0, 0);

    proposals.push({
      user_id: userId,
      title: generated.title,
      content_text: generated.text,
      content_type: 'social',
      channel,
      scheduled_for: scheduledDate.toISOString(),
      based_on: {
        strategy_goal: strategy.primary_goal,
        content_mix_type: mixType,
        product_id: product?.id,
        product_name: product?.name,
        team_member_id: member?.id,
        team_member_name: member?.name,
        trigger: 'weekly_schedule',
      },
      hashtags: generated.hashtags,
      tone: 'professional',
      status: 'pending',
    });
  }

  if (proposals.length > 0) {
    const { data, error } = await supabase
      .from('go_content_proposals')
      .insert(proposals)
      .select();
    if (error) throw error;
    return data as ContentProposal[];
  }
  return [];
}
