'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Palette, Link2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SocialAccount } from '@/types';
import { channelIcon } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

function useSocialAccounts() {
  return useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('social_accounts').select('*').order('created_at', { ascending: false });
      return (data || []) as SocialAccount[];
    },
  });
}

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', color: '#0077B5' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', color: '#000000' },
  { id: 'x', name: 'X / Twitter', color: '#1DA1F2' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: accounts } = useSocialAccounts();

  const connectedPlatforms = new Set(accounts?.map(a => a.platform) || []);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-500">Beheer je account en koppelingen</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profiel</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Account ID</span>
            <span className="text-sm font-mono text-gray-500">{user?.id?.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Social Accounts */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Koppelingen</h2>
        <p className="text-sm text-gray-500 mb-4">Verbind je social media accounts om content te publiceren. OAuth werkt het beste vanuit de browser.</p>
        <div className="space-y-3">
          {PLATFORMS.map(platform => {
            const account = accounts?.find(a => a.platform === platform.id);
            const connected = !!account;
            return (
              <div key={platform.id} className="flex items-center gap-4 rounded-lg border border-gray-200 p-4">
                <span className="text-2xl">{channelIcon(platform.id)}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{platform.name}</p>
                  {connected ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verbonden als {account.account_name}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">Niet verbonden</p>
                  )}
                </div>
                {connected ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Actief</span>
                ) : (
                  <button className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors">
                    <Link2 className="h-4 w-4" /> Verbinden
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Voorkeuren</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Taal</p>
              <p className="text-xs text-gray-500">Interface taal</p>
            </div>
            <select className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Thema</p>
              <p className="text-xs text-gray-500">Licht of donker</p>
            </div>
            <select className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
              <option value="light">Licht</option>
              <option value="dark">Donker</option>
              <option value="auto">Automatisch</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
