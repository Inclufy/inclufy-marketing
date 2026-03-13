// src/services/context-marketing/networking-engine.service.ts
// Networking Engine — Lead capture via QR, NFC, LinkedIn scanning, AI enrichment & follow-up

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

const mockContacts: CapturedContact[] = [
  {
    id: 'nc-001', name: 'Marc Van Hoeck', email: 'marc@techventures.be', phone: '+32 476 123 456', company: 'TechVentures Belgium', title: 'CTO', linkedin_url: 'linkedin.com/in/marcvanhoeck', capture_method: 'qr_code', captured_at: '2026-03-10T14:30:00Z', event_id: 'evt-001', event_name: 'SaaS Growth Summit Benelux', status: 'enriched',
    enrichment: { company_size: '50-200', industry: 'Technology', revenue_range: '5M-20M', location: 'Antwerpen', technologies: ['React', 'AWS', 'HubSpot'], social_profiles: ['linkedin', 'twitter'], score: 87 },
    ai_insights: { intent_score: 82, best_channel: 'LinkedIn', best_time: 'Dinsdag 10:00', suggested_follow_up: 'Stuur case study over tech sector + demo uitnodiging', talking_points: ['Besproken: AI attribution uitdagingen', 'Gebruikt momenteel HubSpot', 'Zoekt betere lead scoring'], mutual_connections: 4 },
    follow_up: { template: 'tech-sector-intro', scheduled_at: '2026-03-12T10:00:00Z', sent: false, opened: false, replied: false },
    notes: 'Zeer geinteresseerd in multi-touch attribution. Huidige tool mist AI capabilities.', tags: ['hot-lead', 'tech', 'SaaS Summit'],
  },
  {
    id: 'nc-002', name: 'Isabelle Claessens', email: 'isabelle@brandcraft.nl', company: 'BrandCraft Agency', title: 'Managing Partner', linkedin_url: 'linkedin.com/in/isabelleclaessens', capture_method: 'linkedin_scan', captured_at: '2026-03-10T15:45:00Z', event_id: 'evt-001', event_name: 'SaaS Growth Summit Benelux', status: 'follow_up_sent',
    enrichment: { company_size: '10-50', industry: 'Marketing Agency', revenue_range: '2M-5M', location: 'Rotterdam', technologies: ['Adobe', 'Salesforce'], social_profiles: ['linkedin'], score: 78 },
    ai_insights: { intent_score: 75, best_channel: 'Email', best_time: 'Woensdag 09:00', suggested_follow_up: 'Agency partnership voorstel + white-label demo', talking_points: ['Zoekt AI tools voor klanten', 'Overweegt white-label oplossing', 'Budget approved voor Q2'], mutual_connections: 2 },
    follow_up: { template: 'agency-partnership', scheduled_at: '2026-03-11T09:00:00Z', sent: true, opened: true, replied: false },
    notes: 'Agency met 40+ klanten. Zoekt white-label marketing AI platform.', tags: ['agency', 'partnership', 'white-label'],
  },
  {
    id: 'nc-003', name: 'Thomas Schneider', email: 'tschneider@globalretail.de', company: 'GlobalRetail GmbH', title: 'Head of Digital', capture_method: 'business_card', captured_at: '2026-03-09T11:00:00Z', event_name: 'Digital Meetup Berlin', status: 'synced_crm',
    enrichment: { company_size: '1000+', industry: 'Retail', revenue_range: '100M+', location: 'Berlin', technologies: ['SAP', 'Salesforce', 'Google Analytics'], social_profiles: ['linkedin', 'xing'], score: 92 },
    ai_insights: { intent_score: 68, best_channel: 'Email', best_time: 'Maandag 08:00', suggested_follow_up: 'Enterprise demo + retail case studies + ROI calculator', talking_points: ['Pain point: attribution across 200+ stores', 'Groot marketing team (45 mensen)', 'Budget cyclus start april'], mutual_connections: 1 },
    follow_up: { template: 'enterprise-retail', sent: false, opened: false, replied: false },
    notes: 'Enterprise account. Enorm potentieel. Zoekt enterprise-grade attribution.', tags: ['enterprise', 'retail', 'high-value', 'Germany'],
  },
  {
    id: 'nc-004', name: 'Aisha Rahman', email: 'aisha@startupboost.io', company: 'StartupBoost', title: 'Founder', capture_method: 'nfc', captured_at: '2026-03-08T16:20:00Z', event_name: 'Startup Drinks Brussels', status: 'meeting_booked',
    enrichment: { company_size: '1-10', industry: 'Startup Accelerator', revenue_range: '<1M', location: 'Brussels', technologies: ['No-code tools', 'Zapier'], social_profiles: ['linkedin', 'twitter', 'instagram'], score: 65 },
    ai_insights: { intent_score: 88, best_channel: 'WhatsApp', best_time: 'Vrijdag 14:00', suggested_follow_up: 'Startup plan demo + portfolio integratie mogelijkheden', talking_points: ['Accelerator met 20 startups in portfolio', 'Wil marketing tool aanbieden aan portfolio', 'Snelle beslisser'], mutual_connections: 6 },
    follow_up: { template: 'startup-accelerator', scheduled_at: '2026-03-11T14:00:00Z', sent: true, opened: true, replied: true },
    notes: 'Meeting gepland voor vrijdag. Wil Inclufy als standaard tool voor haar portfolio startups.', tags: ['startup', 'accelerator', 'partnership', 'meeting-booked'],
  },
  {
    id: 'nc-005', name: 'Jan-Willem de Boer', email: 'jw@mediagroep.nl', company: 'Nederlandse MediaGroep', title: 'Marketing Director', capture_method: 'event_badge', captured_at: '2026-03-07T10:15:00Z', event_name: 'MarTech Day Netherlands', status: 'converted',
    enrichment: { company_size: '200-500', industry: 'Media', revenue_range: '20M-50M', location: 'Hilversum', technologies: ['Google Marketing Platform', 'DV360'], social_profiles: ['linkedin'], score: 88 },
    ai_insights: { intent_score: 95, best_channel: 'Phone', best_time: 'Dinsdag 11:00', suggested_follow_up: 'Contract voorstel + onboarding plan', talking_points: ['Deal gesloten: Enterprise plan', 'Implementatie start volgende week', 'Wil alle 3 business units onboarden'], mutual_connections: 3 },
    follow_up: { template: 'onboarding', sent: true, opened: true, replied: true },
    notes: 'GEWONNEN! Enterprise deal. EUR 78,000/jaar. Start onboarding 17 maart.', tags: ['customer', 'enterprise', 'media', 'won'],
  },
];

const mockQRCodes: QRCodeConfig[] = [
  { id: 'qr-001', name: 'SaaS Summit Booth QR', url: 'https://inclufy.com/connect/saas-summit', scans: 234, leads_captured: 67, event_id: 'evt-001', created_at: '2026-03-01', active: true },
  { id: 'qr-002', name: 'General Contact Card', url: 'https://inclufy.com/connect/team', scans: 89, leads_captured: 34, created_at: '2026-02-15', active: true },
  { id: 'qr-003', name: 'Product Demo Link', url: 'https://inclufy.com/demo', scans: 456, leads_captured: 123, created_at: '2026-01-10', active: true },
];

class NetworkingEngineService {
  async getContacts(status?: ContactStatus): Promise<CapturedContact[]> {
    return new Promise(r => setTimeout(() => {
      if (status) r(mockContacts.filter(c => c.status === status));
      else r([...mockContacts].sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()));
    }, 500));
  }

  async getMetrics(): Promise<NetworkingMetrics> {
    return new Promise(r => setTimeout(() => r({
      total_contacts: 456, contacts_this_month: 67, enrichment_rate: 94.2, crm_sync_rate: 88.5, follow_up_sent_rate: 76.3, reply_rate: 34.8, meetings_booked: 23, conversion_rate: 12.4,
      capture_by_method: [
        { method: 'qr_code', count: 167, color: '#8b5cf6' },
        { method: 'linkedin_scan', count: 123, color: '#3b82f6' },
        { method: 'business_card', count: 89, color: '#10b981' },
        { method: 'event_badge', count: 45, color: '#f59e0b' },
        { method: 'nfc', count: 22, color: '#ec4899' },
        { method: 'manual', count: 10, color: '#6b7280' },
      ],
      weekly_captures: [
        { week: 'W7', contacts: 12, enriched: 11, converted: 1 },
        { week: 'W8', contacts: 18, enriched: 17, converted: 2 },
        { week: 'W9', contacts: 34, enriched: 32, converted: 4 },
        { week: 'W10', contacts: 45, enriched: 43, converted: 6 },
      ],
    }), 500));
  }

  async getQRCodes(): Promise<QRCodeConfig[]> {
    return new Promise(r => setTimeout(() => r([...mockQRCodes]), 300));
  }

  async enrichContact(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 1500));
  }

  async syncToCRM(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 800));
  }

  async sendFollowUp(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 1000));
  }

  async generateQRCode(name: string, url: string = `https://inclufy.com/connect/${name}`): Promise<QRCodeConfig> {
    return new Promise(r => setTimeout(() => r({ id: `qr-${Date.now()}`, name, url, scans: 0, leads_captured: 0, created_at: new Date().toISOString(), active: true }), 800));
  }

  async scanBusinessCard(imageData: string): Promise<Partial<CapturedContact>> {
    return new Promise(r => setTimeout(() => r({ name: 'Scanned Contact', email: 'contact@example.com', company: 'Company', title: 'Title', capture_method: 'business_card' as CaptureMethod }), 2000));
  }
}

export const networkingEngineService = new NetworkingEngineService();
export default networkingEngineService;
