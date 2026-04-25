import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// ─── DB row types ────────────────────────────────────────────────────

export interface WhatsAppConfig {
  id:                   string;
  user_id:              string;
  waba_id:              string;
  phone_number_id:      string;
  display_phone_number: string | null;
  business_name:        string | null;
  /** access_token stored in DB — never expose in UI */
  access_token:         string;
  status:               'active' | 'expired' | 'disabled';
  created_at:           string;
  updated_at:           string;
}

export interface WhatsAppTemplate {
  id:              string;
  waba_config_id:  string;
  name:            string;
  language:        string;
  category:        'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status:          'pending' | 'approved' | 'rejected';
  body_text:       string | null;
  header_type:     string | null;
  components:      unknown | null;
  meta_template_id: string | null;
  created_at:      string;
  updated_at:      string;
}

export interface WhatsAppRecipient {
  id:             string;
  user_id:        string;
  waba_config_id: string;
  phone_e164:     string;
  display_name:   string | null;
  opt_in_at:      string;
  opt_out_at:     string | null;
  source:         string | null;
  tags:           string[] | null;
  created_at:     string;
}

export interface WhatsAppSend {
  id:              string;
  user_id:         string;
  post_id:         string | null;
  recipient_id:    string | null;
  template_id:     string | null;
  phone_e164:      string;
  meta_message_id: string | null;
  status:          'sent' | 'delivered' | 'read' | 'failed';
  error:           string | null;
  cost_usd:        number | null;
  sent_at:         string;
}

export interface SendWhatsAppParams {
  postId?:       string;
  templateName:  string;
  templateLang:  string;
  recipients:    string[];           // E.164 phone numbers
  variables?:    Record<string, string>;
}

export interface SendWhatsAppResult {
  success:        boolean;
  sent:           number;
  failed:         number;
  skipped:        number;
  total_recipients: number;
  total_cost_usd: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────

/** Returns the current user's active WABA configuration (if any). */
export function useWhatsAppConfig() {
  return useQuery<WhatsAppConfig | null>({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as WhatsAppConfig | null;
    },
    staleTime: 60_000,
  });
}

/** Returns all approved templates for the current user's active WABA. */
export function useWhatsAppTemplates() {
  const { data: config } = useWhatsAppConfig();

  return useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsapp-templates', config?.id],
    queryFn: async () => {
      if (!config?.id) return [];

      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('waba_config_id', config.id)
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      return (data ?? []) as WhatsAppTemplate[];
    },
    enabled: !!config?.id,
    staleTime: 60_000,
  });
}

/** Returns all opted-in (not opted-out) recipients for the current user. */
export function useWhatsAppRecipients() {
  return useQuery<WhatsAppRecipient[]>({
    queryKey: ['whatsapp-recipients'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('whatsapp_recipients')
        .select('*')
        .eq('user_id', user.id)
        .is('opt_out_at', null)         // opted-in only
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as WhatsAppRecipient[];
    },
    staleTime: 30_000,
  });
}

/** Returns recent sends (audit trail) — most recent 100. */
export function useWhatsAppSends(limit = 100) {
  return useQuery<WhatsAppSend[]>({
    queryKey: ['whatsapp-sends', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('whatsapp_sends')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as WhatsAppSend[];
    },
    staleTime: 15_000,
  });
}

/** Add a new recipient with opt-in timestamp. */
export function useAddWhatsAppRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      phoneE164:    string;
      displayName?: string;
      source?:      string;
      tags?:        string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (!config) throw new Error('Geen actieve WABA configuratie gevonden');

      const { data, error } = await supabase
        .from('whatsapp_recipients')
        .upsert(
          {
            user_id:        user.id,
            waba_config_id: config.id,
            phone_e164:     params.phoneE164,
            display_name:   params.displayName ?? null,
            source:         params.source ?? 'manual',
            tags:           params.tags ?? null,
            opt_in_at:      new Date().toISOString(),
            opt_out_at:     null,                 // clear any prior opt-out
          },
          { onConflict: 'user_id,phone_e164' },
        )
        .select('*')
        .single();

      if (error) throw error;
      return data as WhatsAppRecipient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-recipients'] });
    },
  });
}

/** Opt a recipient out (sets opt_out_at = now). */
export function useOptOutRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase
        .from('whatsapp_recipients')
        .update({ opt_out_at: new Date().toISOString() })
        .eq('id', recipientId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-recipients'] });
    },
  });
}

/**
 * Send a WhatsApp template message to a list of opted-in recipients.
 *
 * Example usage:
 *   const { mutateAsync: send } = useSendWhatsAppTemplate();
 *   const result = await send({
 *     postId: post.id,
 *     templateName: 'event_invite',
 *     templateLang: 'nl',
 *     recipients: ['+31612345678'],
 *     variables: { '1': 'Beurs Rotterdam', '2': 'donderdag 24 april' },
 *   });
 */
export function useSendWhatsAppTemplate() {
  const qc = useQueryClient();
  return useMutation<SendWhatsAppResult, Error, SendWhatsAppParams>({
    mutationFn: async ({ postId, templateName, templateLang, recipients, variables }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          post_id:       postId ?? null,
          user_id:       user.id,
          template_name: templateName,
          template_lang: templateLang,
          recipients,
          variables:     variables ?? {},
        },
      });

      if (error) {
        const rawBody = (error as { context?: { body?: string } })?.context?.body;
        const errMsg  = typeof rawBody === 'string'
          ? rawBody
          : (error as Error).message ?? 'WhatsApp send mislukt';
        throw new Error(errMsg);
      }

      if (data && !data.success) {
        throw new Error(data.error ?? 'WhatsApp send mislukt');
      }

      return data as SendWhatsAppResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-sends'] });
    },
  });
}

// ─── Upsert WABA configuration (in-app WABA setup) ───────────────────

export interface UpsertWhatsAppConfigParams {
  waba_id:              string;
  phone_number_id:      string;
  display_phone_number?: string | null;
  business_name?:       string | null;
  access_token:         string;
  /** Optional: row id when editing existing config (vs inserting new) */
  id?:                  string;
}

/**
 * Upserts the user's WhatsApp Business Account credentials.
 * Stored in `whatsapp_config` table with status='active' so existing queries pick it up.
 * Note: access_token is stored as plaintext today — encrypt server-side in a future migration.
 */
export function useUpsertWhatsAppConfig() {
  const qc = useQueryClient();
  return useMutation<WhatsAppConfig, Error, UpsertWhatsAppConfigParams>({
    mutationFn: async (params) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const trimmedToken = params.access_token.trim();
      const keepExistingToken = trimmedToken === '__KEEP__' || trimmedToken === '';

      // Base payload (no token field)
      const basePayload = {
        user_id:              user.id,
        waba_id:              params.waba_id.trim(),
        phone_number_id:      params.phone_number_id.trim(),
        display_phone_number: params.display_phone_number?.trim() || null,
        business_name:        params.business_name?.trim() || null,
        status:               'active' as const,
        updated_at:           new Date().toISOString(),
      };

      // On insert OR token rotation: include access_token
      const payload = keepExistingToken && params.id
        ? basePayload
        : { ...basePayload, access_token: trimmedToken };

      if (!params.id && keepExistingToken) {
        throw new Error('Access token is verplicht bij eerste WABA setup.');
      }

      const query = params.id
        ? supabase.from('whatsapp_config').update(payload).eq('id', params.id).eq('user_id', user.id)
        : supabase.from('whatsapp_config').upsert(payload, { onConflict: 'user_id,phone_number_id' });

      const { data, error } = await query.select().single();
      if (error) throw error;
      return data as WhatsAppConfig;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
  });
}

// ─── Sync templates from Meta Graph API ─────────────────────────────

export interface SyncTemplatesResult {
  ok: boolean;
  waba_id: string;
  synced: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ name: string; language: string; error: string }>;
}

export function useSyncWhatsAppTemplates() {
  const qc = useQueryClient();
  return useMutation<SyncTemplatesResult, Error, { wabaConfigId?: string } | void>({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-sync-templates', {
        body: params ?? {},
      });
      if (error) {
        const rawBody = (error as { context?: { body?: string } })?.context?.body;
        const msg = typeof rawBody === 'string' ? rawBody : (error as Error).message;
        throw new Error(msg || 'sync mislukt');
      }
      if (!data?.ok) throw new Error(data?.error ?? 'sync mislukt');
      return data as SyncTemplatesResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
  });
}

// ─── Bulk add recipients (CSV import support) ────────────────────────

export interface BulkRecipient {
  phone_e164: string;
  display_name?: string;
  tags?: string[];
}

export interface BulkAddResult {
  inserted: number;
  duplicates: number;
  invalid: number;
  errors: Array<{ phone: string; error: string }>;
}

/**
 * Bulk-add recipients. Validates E.164 client-side, dedupes against existing,
 * inserts in chunks of 100 to avoid Supabase row-limit edge cases.
 */
export function useBulkAddWhatsAppRecipients() {
  const qc = useQueryClient();
  return useMutation<BulkAddResult, Error, { recipients: BulkRecipient[]; source?: string }>({
    mutationFn: async ({ recipients, source = 'csv_import' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Resolve active WABA config
      const { data: cfg } = await supabase
        .from('whatsapp_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (!cfg) throw new Error('Geen actieve WhatsApp Business Account.');

      // Normalize + validate
      const e164 = /^\+[1-9]\d{6,14}$/;
      const cleaned: BulkRecipient[] = [];
      const invalidEntries: Array<{ phone: string; error: string }> = [];

      for (const r of recipients) {
        const phone = (r.phone_e164 ?? '').replace(/[\s\-\(\)]/g, '');
        if (!e164.test(phone)) {
          invalidEntries.push({ phone: r.phone_e164, error: 'Geen geldig E.164 formaat (+...)' });
          continue;
        }
        cleaned.push({
          phone_e164: phone,
          display_name: r.display_name?.trim() || undefined,
          tags: r.tags ?? [],
        });
      }

      // Insert in batches with onConflict ignore to count duplicates
      const CHUNK = 100;
      let inserted = 0;
      let duplicates = 0;
      const insertErrors: Array<{ phone: string; error: string }> = [];

      for (let i = 0; i < cleaned.length; i += CHUNK) {
        const batch = cleaned.slice(i, i + CHUNK).map((r) => ({
          user_id: user.id,
          waba_config_id: cfg.id,
          phone_e164: r.phone_e164,
          display_name: r.display_name ?? null,
          source,
          tags: r.tags ?? [],
        }));

        const { data: ins, error: insErr } = await supabase
          .from('whatsapp_recipients')
          .upsert(batch, { onConflict: 'user_id,phone_e164', ignoreDuplicates: true })
          .select('id');

        if (insErr) {
          for (const r of batch) insertErrors.push({ phone: r.phone_e164, error: insErr.message });
          continue;
        }

        const insertedThisBatch = ins?.length ?? 0;
        inserted += insertedThisBatch;
        duplicates += batch.length - insertedThisBatch;
      }

      return {
        inserted,
        duplicates,
        invalid: invalidEntries.length,
        errors: [...invalidEntries, ...insertErrors],
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-recipients'] });
    },
  });
}

/** Disconnect WABA (set status='disabled'). Keeps row for audit. */
export function useDisconnectWhatsAppConfig() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (configId) => {
      const { error } = await supabase
        .from('whatsapp_config')
        .update({ status: 'disabled', updated_at: new Date().toISOString() })
        .eq('id', configId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
  });
}
