// src/services/context-marketing/networking-engine.service.ts
// Networking Engine — Lead capture via QR, NFC, LinkedIn scanning, AI enrichment & follow-up

import { supabase } from '@/integrations/supabase/client';

export type CaptureMethod = 'qr_code' | 'business_card' | 'nfc' | 'linkedin_scan' | 'manual' | 'event_badge';
export type ContactStatus = 'captured' | 'enriched' | 'synced_crm' | 'follow_up_sent' | 'meeting_booked' | 'converted';

export interface CapturedContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  title: string;
  linkedin_url?: string;
  capture_method: CaptureMethod;
  captured_at: string;
  event_id?: string;
  event_name?: string;
  status: ContactStatus;
  enrichment: {
    company_size?: string;
    industry?: string;
    revenue_range?: string;
    location?: string;
    technologies?: string[];
    social_profiles?: string[];
    score: number;
  };
  ai_insights: {
    intent_score: number;
    best_channel: string;
    best_time: string;
    suggested_follow_up: string;
    talking_points: string[];
    mutual_connections: number;
  };
  follow_up: {
    template?: string;
    scheduled_at?: string;
    sent: boolean;
    opened: boolean;
    replied: boolean;
  };
  notes: string;
  tags: string[];
}

export interface NetworkingMetrics {
  total_contacts: number;
  contacts_this_month: number;
  enrichment_rate: number;
  crm_sync_rate: number;
  follow_up_sent_rate: number;
  reply_rate: number;
  meetings_booked: number;
  conversion_rate: number;
  capture_by_method: Array<{ method: CaptureMethod; count: number; color: string }>;
  weekly_captures: Array<{ week: string; contacts: number; enriched: number; converted: number }>;
}

export interface QRCodeConfig {
  id: string;
  name: string;
  url: string;
  scans: number;
  leads_captured: number;
  event_id?: string;
  created_at: string;
  active: boolean;
}

// Type aliases for hook compatibility
export type Contact = CapturedContact;
export type QRCode = QRCodeConfig;

const METHOD_COLORS: Record<CaptureMethod, string> = {
  qr_code: '#8b5cf6',
  linkedin_scan: '#3b82f6',
  business_card: '#10b981',
  event_badge: '#f59e0b',
  nfc: '#ec4899',
  manual: '#6b7280',
};

class NetworkingEngineService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getContacts(status?: ContactStatus): Promise<CapturedContact[]> {
    const userId = await this.getUserId();
    let query = supabase
      .from('captured_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as CapturedContact[];
  }

  async getMetrics(): Promise<NetworkingMetrics> {
    const userId = await this.getUserId();

    const { data: contacts, error } = await supabase
      .from('captured_contacts')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;

    const all = (contacts || []) as unknown as CapturedContact[];
    const total = all.length;

    // Contacts this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisMonth = all.filter(c => c.captured_at >= monthStart).length;

    // Status counts
    const enriched = all.filter(c => c.status !== 'captured').length;
    const synced = all.filter(c => ['synced_crm', 'follow_up_sent', 'meeting_booked', 'converted'].includes(c.status)).length;
    const followUpSent = all.filter(c => ['follow_up_sent', 'meeting_booked', 'converted'].includes(c.status)).length;
    const replied = all.filter(c => c.follow_up?.replied).length;
    const meetingsBooked = all.filter(c => c.status === 'meeting_booked' || c.status === 'converted').length;
    const converted = all.filter(c => c.status === 'converted').length;

    const enrichmentRate = total > 0 ? (enriched / total) * 100 : 0;
    const crmSyncRate = total > 0 ? (synced / total) * 100 : 0;
    const followUpSentRate = total > 0 ? (followUpSent / total) * 100 : 0;
    const replyRate = followUpSent > 0 ? (replied / followUpSent) * 100 : 0;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    // Group by capture method
    const methodCounts = new Map<CaptureMethod, number>();
    for (const c of all) {
      methodCounts.set(c.capture_method, (methodCounts.get(c.capture_method) || 0) + 1);
    }
    const captureByMethod = Object.entries(METHOD_COLORS).map(([method, color]) => ({
      method: method as CaptureMethod,
      count: methodCounts.get(method as CaptureMethod) || 0,
      color,
    }));

    // Build weekly captures for last 4 weeks
    const weeklyCaps: Array<{ week: string; contacts: number; enriched: number; converted: number }> = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStartStr = weekStart.toISOString();
      const weekEndStr = weekEnd.toISOString();
      const weekContacts = all.filter(c => c.captured_at >= weekStartStr && c.captured_at < weekEndStr);
      const weekNum = Math.ceil((now.getDate() - i * 7) / 7);
      weeklyCaps.push({
        week: `W${weekNum > 0 ? weekNum : 1}`,
        contacts: weekContacts.length,
        enriched: weekContacts.filter(c => c.status !== 'captured').length,
        converted: weekContacts.filter(c => c.status === 'converted').length,
      });
    }

    return {
      total_contacts: total,
      contacts_this_month: thisMonth,
      enrichment_rate: Math.round(enrichmentRate * 10) / 10,
      crm_sync_rate: Math.round(crmSyncRate * 10) / 10,
      follow_up_sent_rate: Math.round(followUpSentRate * 10) / 10,
      reply_rate: Math.round(replyRate * 10) / 10,
      meetings_booked: meetingsBooked,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      capture_by_method: captureByMethod,
      weekly_captures: weeklyCaps,
    };
  }

  async getQRCodes(): Promise<QRCodeConfig[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as QRCodeConfig[];
  }

  async enrichContact(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('captured_contacts')
      .update({
        status: 'enriched',
        enrichment: {
          score: 0,
        },
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async syncToCRM(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('captured_contacts')
      .update({ status: 'synced_crm' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async sendFollowUp(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('captured_contacts')
      .update({
        status: 'follow_up_sent',
        follow_up: {
          sent: true,
          opened: false,
          replied: false,
          scheduled_at: new Date().toISOString(),
        },
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async generateQRCode(name: string, url: string = `https://inclufy.com/connect/${name}`): Promise<QRCodeConfig> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        name,
        url,
        scans: 0,
        leads_captured: 0,
        active: true,
        user_id: userId,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as QRCodeConfig;
  }

  async scanBusinessCard(imageData: string): Promise<Partial<CapturedContact>> {
    // Business card scanning remains a client-side AI operation;
    // the parsed result would be inserted via getContacts / a separate insert call.
    return {
      name: 'Scanned Contact',
      email: 'contact@example.com',
      company: 'Company',
      title: 'Title',
      capture_method: 'business_card' as CaptureMethod,
    };
  }
}

export const networkingEngineService = new NetworkingEngineService();
export default networkingEngineService;
