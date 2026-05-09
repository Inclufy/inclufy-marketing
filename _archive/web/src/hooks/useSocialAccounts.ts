'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { SocialAccount } from '@/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '789493c65q6j5e';
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '947950264797942';
const TIKTOK_CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || 'sbaw0n7p637do602ql';
const LINKEDIN_LMDP = process.env.NEXT_PUBLIC_LINKEDIN_LMDP === 'true';

export type ConnectablePlatform = 'linkedin' | 'facebook' | 'instagram' | 'tiktok';

export function useSocialAccounts() {
  return useQuery<SocialAccount[]>({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialAccount[];
    },
    staleTime: 30_000,
  });
}

export function useDisconnectSocialAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('social_accounts').delete().eq('id', accountId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-accounts'] }),
  });
}

export function useManualConnectSocialAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      platform: string;
      accountName: string;
      accountUrl?: string;
    }) => {
      const supabase = createClient();
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error('Niet ingelogd');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/oauth-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          platform: params.platform,
          accountName: params.accountName.trim(),
          accountUrl: params.accountUrl?.trim() || undefined,
          accountType: 'manual',
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || 'Manual connect mislukt');
      }
      return await res.json().catch(() => ({}));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-accounts'] }),
  });
}

async function buildOAuthUrl(platform: ConnectablePlatform): Promise<string> {
  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error('Niet ingelogd');
  const userId = userData.user.id;

  let orgId = userId;
  try {
    const { data: goOrg } = await supabase
      .from('go_organization')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (goOrg?.organization_id) orgId = goOrg.organization_id;
  } catch {}

  const redirectUri = `${SUPABASE_URL}/functions/v1/oauth-callback`;
  const state = `${userId}:${orgId}:${platform}`;

  if (platform === 'linkedin') {
    const basicScopes = 'openid profile email w_member_social';
    const lmdpScopes = ' r_organization_social w_organization_social rw_organization_admin';
    const scopes = basicScopes + (LINKEDIN_LMDP ? lmdpScopes : '');
    return (
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
      `&client_id=${LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${encodeURIComponent(state)}`
    );
  }
  if (platform === 'facebook' || platform === 'instagram') {
    const scope =
      'pages_show_list,pages_manage_posts,pages_read_engagement,' +
      'instagram_basic,instagram_content_publish,public_profile';
    return (
      `https://www.facebook.com/v21.0/dialog/oauth?response_type=code` +
      `&client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}`
    );
  }
  if (platform === 'tiktok') {
    const scope = 'user.info.basic,video.publish,video.list';
    return (
      `https://www.tiktok.com/v2/auth/authorize/?response_type=code` +
      `&client_key=${TIKTOK_CLIENT_KEY}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}`
    );
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

export function useStartOAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (platform: ConnectablePlatform): Promise<{ closed: boolean }> => {
      const authUrl = await buildOAuthUrl(platform);

      const w = 600;
      const h = 750;
      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;
      const popup = window.open(
        authUrl,
        'oauth-popup',
        `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no`,
      );
      if (!popup) throw new Error('Popup geblokkeerd — sta popups toe en probeer opnieuw');

      return new Promise((resolve) => {
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            setTimeout(() => qc.invalidateQueries({ queryKey: ['social-accounts'] }), 500);
            setTimeout(() => qc.invalidateQueries({ queryKey: ['social-accounts'] }), 3000);
            resolve({ closed: true });
          }
        }, 600);
      });
    },
  });
}
