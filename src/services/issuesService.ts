/**
 * issuesService — mobile bridge to the AMOS `product-issues` Supabase edge
 * function (commit 9e1afc1). Posts shake-triggered issue reports.
 *
 * Auth + tenant scoping use the same Supabase client as the rest of the app.
 */
import { Platform, Dimensions, AppState } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export type IssueCategory =
  | 'ui'
  | 'api'
  | 'mobile'
  | 'performance'
  | 'security'
  | 'auth'
  | 'data'
  | 'integration'
  | 'documentation'
  | 'other';

export interface IssueAttachmentInline {
  name: string;
  data_url: string;
  mime: string;
  size_bytes: number;
}

export interface CreateMobileIssueInput {
  organization_id: string;
  title: string;
  description?: string;
  category?: IssueCategory;
  module_context?: string | null;
  reproduction_steps?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  error_trace?: string;
  environment?: Record<string, unknown>;
  attachments?: IssueAttachmentInline[];
  capture_method?: string;
}

export interface CreatedIssue {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  created_at: string;
}

const SUPABASE_URL = 'https://mpxkugfqzmxydxnlxqoj.supabase.co';

/**
 * Map a React Navigation route name to an AMOS `module_context` slug.
 * Falls back to a sanitised version of the route name.
 */
export function detectAMOSMobileModule(routeName: string | null): string | null {
  if (!routeName) return 'home';
  const map: Record<string, string> = {
    HomeTab: 'dashboard',
    Home: 'dashboard',
    Dashboard: 'dashboard',
    EventsTab: 'events',
    EventsRoot: 'events',
    EventListScreen: 'events',
    EventIntelligenceTab: 'events',
    CampaignsTab: 'campaigns',
    CampaignsRoot: 'campaigns',
    CampaignList: 'campaigns',
    CampaignListTab: 'campaigns',
    AllPostsTab: 'posts',
    PostsList: 'posts',
    LibraryScreen: 'library',
    LibraryPostDetailScreen: 'library',
    CopilotTab: 'copilot',
    AIRoot: 'copilot',
    AMOSHubScreen: 'copilot',
    OpportunityFeedTab: 'opportunities',
    OpportunityFeedScreen: 'opportunities',
    AutonomousHubTab: 'automations',
    MarketingStrategyScreen: 'strategy',
    SettingsScreen: 'settings',
    OrganizationScreen: 'organization',
    BiometricScreen: 'auth',
  };
  return map[routeName] ?? routeName.replace(/(Screen|Tab|Root)$/, '').toLowerCase();
}

export function captureMobileEnvironment(
  routeName: string | null,
  organizationId: string | null
): Record<string, unknown> {
  const w = Dimensions.get('window');
  const buildSha =
    Constants.expoConfig?.extra?.buildSha ??
    process.env.EXPO_PUBLIC_BUILD_SHA ??
    'unknown';
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const buildNumber =
    Platform.OS === 'ios'
      ? (Constants.expoConfig?.ios?.buildNumber ?? 'unknown')
      : String(Constants.expoConfig?.android?.versionCode ?? 'unknown');

  return {
    route_name: routeName,
    page_url: `amos://${routeName ?? 'home'}`,
    platform: Platform.OS,
    platform_version: String(Platform.Version ?? 'unknown'),
    viewport: { w: w.width, h: w.height, scale: w.scale },
    captured_at: new Date().toISOString(),
    organization_id: organizationId,
    app_version: appVersion,
    app_build_number: buildNumber,
    app_build_sha: buildSha,
    app_state: AppState.currentState,
    is_mobile: true,
    module_context: detectAMOSMobileModule(routeName),
  };
}

/**
 * Fetch the primary organization the current user belongs to. AMOS uses
 * `go_organization` as the canonical user→organization mapping (one row per
 * user, see useOrganization.ts). We fall back to `organization_members` for
 * users who only exist in the web's tenant table.
 */
export async function fetchPrimaryOrgId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. AMOS-canonical: go_organization (per-user company profile).
  //    Schema reality: go_organization has no organization_id column —
  //    each user's go_organization.id IS their tenant identifier.
  const { data: goRow } = await supabase
    .from('go_organization')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const goOrgId = (goRow as { id?: string } | null)?.id;
  if (goOrgId) return goOrgId;

  // 2. Fallback: organization_members (users invited via team UI)
  const { data: omRow } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const omOrgId = (omRow as { organization_id?: string } | null)?.organization_id;
  if (omOrgId) return omOrgId;

  // 3. Last resort: create a minimal go_organization row for this user.
  //    Handles edge case where the user signed up but never went through
  //    onboarding to populate their company profile. RLS on go_organization
  //    allows users to insert their own row (auth.uid() = user_id).
  const { data: created } = await supabase
    .from('go_organization')
    .insert({ user_id: user.id, company_name: '' })
    .select('id')
    .single();
  return (created as { id?: string } | null)?.id ?? null;
}

export async function createIssueFromMobile(
  input: CreateMobileIssueInput
): Promise<CreatedIssue> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Niet ingelogd');

  const url = `${SUPABASE_URL}/functions/v1/product-issues`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create issue failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as CreatedIssue;
}
