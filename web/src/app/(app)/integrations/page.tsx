'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Linkedin, Facebook, Instagram, Music, MessageCircle, Twitter,
  Plug, CheckCircle2, Trash2, Loader2, Link2, Plus, X,
} from 'lucide-react';
import {
  useSocialAccounts, useDisconnectSocialAccount, useStartOAuth,
  useManualConnectSocialAccount, type ConnectablePlatform,
} from '@/hooks/useSocialAccounts';

type PlatformDef = {
  key: string;
  oauthKey?: ConnectablePlatform;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  manualOnly?: boolean;
  comingSoon?: boolean;
};

const PLATFORMS: PlatformDef[] = [
  {
    key: 'linkedin',
    oauthKey: 'linkedin',
    label: 'LinkedIn',
    description: 'Persoonlijk profiel + bedrijfspagina\'s — posts en artikelen',
    icon: Linkedin,
    color: '#0A66C2',
  },
  {
    key: 'facebook',
    oauthKey: 'facebook',
    label: 'Facebook',
    description: 'Pagina\'s en groepen — posts en advertenties',
    icon: Facebook,
    color: '#1877F2',
  },
  {
    key: 'instagram',
    oauthKey: 'instagram',
    label: 'Instagram',
    description: 'Business account — feed, stories en reels',
    icon: Instagram,
    color: '#E4405F',
  },
  {
    key: 'tiktok',
    oauthKey: 'tiktok',
    label: 'TikTok',
    description: 'Videos publiceren naar je TikTok account',
    icon: Music,
    color: '#000000',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Business',
    description: 'Templates en bulk-berichten via Meta WABA',
    icon: MessageCircle,
    color: '#25D366',
    manualOnly: true,
  },
  {
    key: 'x',
    label: 'X (Twitter)',
    description: 'OAuth-koppeling binnenkort beschikbaar',
    icon: Twitter,
    color: '#000000',
    comingSoon: true,
  },
];

export default function IntegrationsPage() {
  const { data: accounts = [], isLoading } = useSocialAccounts();
  const startOAuth = useStartOAuth();
  const disconnect = useDisconnectSocialAccount();
  const manualConnect = useManualConnectSocialAccount();
  const [manualPlatform, setManualPlatform] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const accountsByPlatform = accounts.reduce<Record<string, typeof accounts>>((acc, a) => {
    (acc[a.platform] ??= []).push(a);
    return acc;
  }, {});

  const onConnect = async (platform: ConnectablePlatform, label: string) => {
    try {
      await startOAuth.mutateAsync(platform);
      toast.success(`${label}: vernieuwd na koppeling`);
    } catch (err: any) {
      toast.error(err.message || `Koppelen ${label} mislukt`);
    }
  };

  const onDisconnect = async (id: string, label: string) => {
    if (!confirm(`Account "${label}" loskoppelen?`)) return;
    try {
      await disconnect.mutateAsync(id);
      toast.info(`${label} losgekoppeld`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onManualSubmit = async () => {
    if (!manualPlatform || !manualName.trim()) return;
    try {
      await manualConnect.mutateAsync({
        platform: manualPlatform,
        accountName: manualName.trim(),
        accountUrl: manualUrl.trim() || undefined,
      });
      toast.success(`${manualName} handmatig gekoppeld`);
      setManualPlatform(null);
      setManualName('');
      setManualUrl('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const connectedCount = accounts.length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plug className="h-7 w-7 text-pink-600" />
          <div>
            <h1 className="text-2xl font-bold">Integraties</h1>
            <p className="text-sm text-slate-500">
              Verbind je social media accounts om vanuit web te kunnen publiceren.
            </p>
          </div>
        </div>
        <div className="rounded-full bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700">
          {connectedCount} verbonden
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Tip:</strong> OAuth opent in een popup. Sta popups toe voor deze site.
        Tokens worden opgeslagen in dezelfde Supabase-tabel als de mobile app — éénmaal
        verbinden = werkt overal.
      </div>

      <div className="space-y-3">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const platformAccounts = accountsByPlatform[p.key] ?? [];
          const isLoadingThis = startOAuth.isPending && startOAuth.variables === p.oauthKey;

          return (
            <div
              key={p.key}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: p.color + '18' }}
                >
                  <Icon className="h-6 w-6" style={{ color: p.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{p.label}</h3>
                  <p className="text-sm text-slate-500">{p.description}</p>
                </div>
                {p.comingSoon ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                    Binnenkort
                  </span>
                ) : p.oauthKey ? (
                  <button
                    onClick={() => onConnect(p.oauthKey!, p.label)}
                    disabled={isLoadingThis}
                    className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
                  >
                    {isLoadingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {platformAccounts.length > 0 ? 'Opnieuw' : 'Verbinden'}
                  </button>
                ) : null}
                {!p.comingSoon && (
                  <button
                    onClick={() => setManualPlatform(p.key)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    title="Handmatig koppelen"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Handmatig
                  </button>
                )}
              </div>

              {platformAccounts.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {platformAccounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      {a.profile_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.profile_image_url}
                          alt={a.account_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {a.account_name || 'Onbekend account'}
                          </p>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-500">
                          {a.account_type} · {a.status}
                        </p>
                      </div>
                      <button
                        onClick={() => onDisconnect(a.id, a.account_name)}
                        disabled={disconnect.isPending}
                        className="rounded-full p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Loskoppelen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}

      {manualPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {PLATFORMS.find((p) => p.key === manualPlatform)?.label} handmatig koppelen
              </h2>
              <button
                onClick={() => setManualPlatform(null)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Geen OAuth — alleen voor referentie. Posten kan alleen na een echte OAuth-koppeling.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Accountnaam</label>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Bv. Inclufy NL"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">URL (optioneel)</label>
              <input
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setManualPlatform(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuleren
              </button>
              <button
                onClick={onManualSubmit}
                disabled={!manualName.trim() || manualConnect.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {manualConnect.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Koppelen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
