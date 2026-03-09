// src/pages/Settings.tsx
// Instellingen pagina met tabs: Profiel, Beveiliging, Voorkeuren, API Keys
// 2FA enrollment via Supabase MFA (TOTP)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  User, Shield, Settings as SettingsIcon, Key, Lock, Bell, Moon, Sun, Globe,
  Loader2, Eye, EyeOff, Monitor, Copy, Check, Plus, Trash2, Smartphone, Laptop,
  QrCode, ShieldCheck, ShieldOff, AlertTriangle, RotateCcw, CreditCard, ExternalLink,
  Share2, Linkedin, Facebook, Instagram, Unlink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useSubscription, useCreatePortalSession } from '@/hooks/queries/useSubscription';
import { useSocialAccounts, useConnectSocial, useDisconnectSocial } from '@/hooks/queries/useSocialAccounts';

// Tab definitions
const tabs = [
  { key: 'profile', icon: User, labelKey: 'settings.tab.profile' },
  { key: 'security', icon: Shield, labelKey: 'settings.tab.security' },
  { key: 'subscription', icon: CreditCard, labelKey: 'settings.tab.subscription' },
  { key: 'social', icon: Share2, labelKey: 'settings.tab.social' },
  { key: 'preferences', icon: SettingsIcon, labelKey: 'settings.tab.preferences' },
  { key: 'apikeys', icon: Key, labelKey: 'settings.tab.apiKeys' },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function Settings() {
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [saving, setSaving] = useState(false);

  // Profile state
  const fullName = user?.user_metadata?.full_name || '';
  const email = user?.email || '';
  const [firstName, setFirstName] = useState(fullName.split(' ')[0] || 'Sami');
  const [lastName, setLastName] = useState(fullName.split(' ').slice(1).join(' ') || 'Admin');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('Inclufy');
  const [bio, setBio] = useState('');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [enrollFactorId, setEnrollFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [campaignAlerts, setCampaignAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // API Keys state
  const [apiKeys] = useState([
    { id: 1, name: 'Development Key', key: 'ik_dev_****...a8f2', created: '2025-01-15', lastUsed: '2025-03-01', active: true },
    { id: 2, name: 'Production Key', key: 'ik_prod_****...c7e1', created: '2025-02-20', lastUsed: '2025-03-03', active: true },
  ]);
  const [copiedKey, setCopiedKey] = useState<number | null>(null);

  // ─── Load MFA status on mount ──────────────────────────────
  const loadMfaStatus = useCallback(async () => {
    try {
      setMfaLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verifiedFactors = data.totp.filter(f => f.status === 'verified');
      if (verifiedFactors.length > 0) {
        setMfaEnabled(true);
        setMfaFactorId(verifiedFactors[0].id);
      } else {
        setMfaEnabled(false);
        setMfaFactorId(null);
      }
    } catch (err) {
      console.error('Failed to load MFA status:', err);
    } finally {
      setMfaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMfaStatus();
  }, [loadMfaStatus]);

  // ─── MFA Enrollment ────────────────────────────────────────
  const handleStartEnroll = async () => {
    try {
      setEnrolling(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Inclufy Authenticator',
      });
      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setEnrollFactorId(data.id);
      setVerifyCode('');
    } catch (err: any) {
      toast({ title: t('settings.security.mfaError'), description: err.message, variant: 'destructive' });
      setEnrolling(false);
    }
  };

  const handleVerifyEnroll = async () => {
    if (verifyCode.length !== 6) return;

    try {
      setVerifying(true);

      // Challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollFactorId,
      });
      if (challengeError) throw challengeError;

      // Verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      // Success
      setMfaEnabled(true);
      setMfaFactorId(enrollFactorId);
      setEnrolling(false);
      setQrCode('');
      setMfaSecret('');
      setEnrollFactorId('');
      setVerifyCode('');
      toast({ title: t('settings.security.mfaSuccess') });
    } catch (err: any) {
      if (err.message?.includes('Invalid') || err.message?.includes('invalid')) {
        toast({ title: t('settings.security.mfaInvalidCode'), variant: 'destructive' });
      } else {
        toast({ title: t('settings.security.mfaError'), description: err.message, variant: 'destructive' });
      }
    } finally {
      setVerifying(false);
      setVerifyCode('');
    }
  };

  const handleCancelEnroll = async () => {
    // Unenroll the pending factor
    if (enrollFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: enrollFactorId }).catch(() => {});
    }
    setEnrolling(false);
    setQrCode('');
    setMfaSecret('');
    setEnrollFactorId('');
    setVerifyCode('');
  };

  const handleDisable2FA = async () => {
    if (!mfaFactorId) return;

    try {
      setMfaLoading(true);
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) throw error;

      setMfaEnabled(false);
      setMfaFactorId(null);
      setConfirmDisable(false);
      toast({ title: t('settings.security.mfaRemoved') });
    } catch (err: any) {
      toast({ title: t('settings.security.mfaError'), description: err.message, variant: 'destructive' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  // ─── Other handlers ────────────────────────────────────────
  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: t('settings.profile.saved') });
    }, 600);
  };

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Wachtwoorden komen niet overeen', variant: 'destructive' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: t('settings.security.passwordUpdated') });
    }, 600);
  };

  const handleSavePreferences = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: t('settings.preferences.saved') });
    }, 400);
  };

  const handleCopyKey = (id: number) => {
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(lang === 'nl' ? 'nl-NL' : lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          {t('settings.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-0">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              )}
            >
              <TabIcon className="h-4 w-4" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* ─── PROFILE TAB ──────────────────────────────────── */}
      {activeTab === 'profile' && (<>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{t('settings.profile.title')}</CardTitle>
            <CardDescription>{t('settings.profile.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{t('settings.profile.avatar')}</p>
                <Button variant="outline" size="sm" className="mt-1.5">
                  {t('settings.profile.changeAvatar')}
                </Button>
              </div>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.profile.firstName')}</label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.profile.lastName')}</label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            {/* Email (disabled) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.profile.email')}</label>
              <Input value={email || 'sami@inclufy.com'} disabled className="bg-gray-50 dark:bg-gray-800" />
              <p className="text-xs text-gray-500">{t('settings.profile.emailHint')}</p>
            </div>

            {/* Role (disabled) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.profile.role')}</label>
              <Input value="superadmin" disabled className="bg-gray-50 dark:bg-gray-800" />
            </div>

            {/* Phone + Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.profile.phone')}</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+31 6 12345678" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.profile.company')}</label>
                <Input value={company} onChange={e => setCompany(e.target.value)} />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.profile.bio')}</label>
              <Textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t('settings.profile.bioPlaceholder')}
                rows={3}
              />
            </div>

            {/* Member since */}
            <p className="text-xs text-gray-500">
              {t('settings.profile.memberSince')}: {createdAt}
            </p>

            {/* Save */}
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.profile.saveChanges')}
            </Button>
          </CardContent>
        </Card>

        {/* Onboarding herstarten */}
        <Card className="border-0 shadow-lg border-l-4 border-l-amber-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  {lang === 'nl' ? 'Onboarding herstarten' : lang === 'fr' ? "Relancer l'Onboarding" : 'Restart Onboarding'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'nl'
                    ? 'Doorloop de onboarding wizard opnieuw om je bedrijfsinstellingen bij te werken.'
                    : lang === 'fr'
                    ? "Parcourez à nouveau l'assistant d'intégration pour mettre à jour vos paramètres."
                    : 'Go through the onboarding wizard again to update your business settings.'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.auth.updateUser({ data: { onboarding_completed: false } });
                  navigate('/app/onboarding');
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {lang === 'nl' ? 'Herstarten' : lang === 'fr' ? 'Relancer' : 'Restart'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>)}

      {/* ─── SECURITY TAB ─────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Change */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('settings.security.title')}
              </CardTitle>
              <CardDescription>{t('settings.security.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.security.currentPassword')}</label>
                <div className="relative">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings.security.newPassword')}</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings.security.confirmPassword')}</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdatePassword}
                disabled={saving || !currentPassword || !newPassword}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('settings.security.updatePassword')}
              </Button>
            </CardContent>
          </Card>

          {/* ─── Two-Factor Authentication ─────────────────── */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('settings.security.twoFactor')}
              </CardTitle>
              <CardDescription>{t('settings.security.twoFactorDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mfaLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : mfaEnabled && !enrolling ? (
                /* ─── 2FA IS ENABLED ─────────────────────────── */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          {t('settings.security.mfaEnabled')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('settings.security.mfaEnabledDesc')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {t('common.active')}
                    </Badge>
                  </div>

                  {!confirmDisable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDisable(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200"
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      {t('settings.security.disable2FA')}
                    </Button>
                  ) : (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {t('settings.security.mfaConfirmDisable')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDisable2FA}
                          disabled={mfaLoading}
                        >
                          {mfaLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {t('settings.security.disable2FA')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDisable(false)}
                        >
                          {t('settings.security.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : enrolling ? (
                /* ─── ENROLLMENT FLOW ────────────────────────── */
                <div className="space-y-6">
                  {/* Step 1: QR Code */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <QrCode className="h-4 w-4" />
                      <span>{t('settings.security.scanQR')}</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* QR Code display */}
                      <div className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
                        {qrCode ? (
                          <img
                            src={qrCode}
                            alt="2FA QR Code"
                            className="w-48 h-48"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                          </div>
                        )}
                      </div>

                      {/* Manual secret */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.security.secretKey')}
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono break-all select-all">
                              {mfaSecret}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopySecret}
                              className="shrink-0"
                            >
                              {secretCopied ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Step 2: Enter verification code */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('settings.security.enterCode')}
                          </p>
                          <InputOTP
                            maxLength={6}
                            value={verifyCode}
                            onChange={setVerifyCode}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                              <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                              <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                              <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                              <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                              <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleVerifyEnroll}
                      disabled={verifying || verifyCode.length !== 6}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      {t('settings.security.verifyAndEnable')}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEnroll}>
                      {t('settings.security.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ─── 2FA NOT ENABLED ────────────────────────── */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('settings.security.mfaDisabled')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('settings.security.mfaDisabledDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleStartEnroll}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t('settings.security.enable2FA')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                {t('settings.security.sessions')}
              </CardTitle>
              <CardDescription>{t('settings.security.sessionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current Session */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <Laptop className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">macOS · Chrome</p>
                    <p className="text-xs text-gray-500">Amsterdam, NL · {t('settings.security.currentSession')}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {t('common.active')}
                </Badge>
              </div>
              {/* Another session */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">iOS · Safari</p>
                    <p className="text-xs text-gray-500">Amsterdam, NL · {t('settings.security.lastActive')}: 2 uur geleden</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 text-xs">
                  Revoke
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── SUBSCRIPTION TAB ─────────────────────────────── */}
      {activeTab === 'subscription' && <SubscriptionTab lang={lang} />}

      {/* ─── SOCIAL MEDIA TAB ──────────────────────────────── */}
      {activeTab === 'social' && <SocialMediaTab lang={lang} />}

      {/* ─── PREFERENCES TAB ──────────────────────────────── */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Language */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.preferences.language')}
              </CardTitle>
              <CardDescription>{t('settings.preferences.languageDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={lang === 'nl' ? 'default' : 'outline'}
                  onClick={() => setLang('nl')}
                  className={cn(
                    "gap-2",
                    lang === 'nl' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  )}
                >
                  <span className="text-lg">🇳🇱</span> Nederlands
                </Button>
                <Button
                  variant={lang === 'en' ? 'default' : 'outline'}
                  onClick={() => setLang('en')}
                  className={cn(
                    "gap-2",
                    lang === 'en' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  )}
                >
                  <span className="text-lg">🇬🇧</span> English
                </Button>
                <Button
                  variant={lang === 'fr' ? 'default' : 'outline'}
                  onClick={() => setLang('fr')}
                  className={cn(
                    "gap-2",
                    lang === 'fr' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  )}
                >
                  <span className="text-lg">🇫🇷</span> Français
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                {t('settings.preferences.theme')}
              </CardTitle>
              <CardDescription>{t('settings.preferences.themeDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[
                  { key: 'light', label: t('settings.preferences.light'), icon: Sun },
                  { key: 'dark', label: t('settings.preferences.dark'), icon: Moon },
                  { key: 'system', label: t('settings.preferences.system'), icon: Monitor },
                ].map(opt => (
                  <Button
                    key={opt.key}
                    variant={theme === opt.key ? 'default' : 'outline'}
                    onClick={() => {
                      setTheme(opt.key);
                      localStorage.setItem('theme', opt.key);
                      const root = document.documentElement;
                      if (opt.key === 'dark') root.classList.add('dark');
                      else root.classList.remove('dark');
                    }}
                    className={cn(
                      "gap-2",
                      theme === opt.key && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    )}
                  >
                    <opt.icon className="h-4 w-4" /> {opt.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('settings.preferences.notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('settings.preferences.emailNotifications')}</p>
                  <p className="text-xs text-gray-500">{t('settings.preferences.emailNotificationsDesc')}</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('settings.preferences.campaignAlerts')}</p>
                  <p className="text-xs text-gray-500">{t('settings.preferences.campaignAlertsDesc')}</p>
                </div>
                <Switch checked={campaignAlerts} onCheckedChange={setCampaignAlerts} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('settings.preferences.weeklyReport')}</p>
                  <p className="text-xs text-gray-500">{t('settings.preferences.weeklyReportDesc')}</p>
                </div>
                <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSavePreferences}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.save')}
          </Button>
        </div>
      )}

      {/* ─── API KEYS TAB ─────────────────────────────────── */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6">
          {/* Personal API Keys */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('settings.apiKeys.title')}</CardTitle>
                <CardDescription>{t('settings.apiKeys.subtitle')}</CardDescription>
              </div>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <Plus className="h-4 w-4" />
                {t('settings.apiKeys.createKey')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{key.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs text-gray-500 font-mono">{key.key}</code>
                          <button
                            onClick={() => handleCopyKey(key.id)}
                            className="text-gray-400 hover:text-purple-600"
                          >
                            {copiedKey === key.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {t('settings.apiKeys.created')}: {key.created} · {t('settings.apiKeys.lastUsed')}: {key.lastUsed}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(
                        key.active ? "text-green-600 border-green-200" : "text-red-500 border-red-200"
                      )}>
                        {key.active ? t('common.active') : t('common.inactive')}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Server-side Integrations */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Server-side Integrations</CardTitle>
              <CardDescription>
                {lang === 'nl'
                  ? 'Deze API-sleutels worden server-side geconfigureerd'
                  : lang === 'fr'
                  ? 'Ces clés API sont configurées côté serveur'
                  : 'These API keys are configured server-side'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: t('settings.apiKeys.openai'), desc: t('settings.apiKeys.openaiDesc'), status: 'configured' },
                { name: t('settings.apiKeys.emailProvider'), desc: t('settings.apiKeys.emailProviderDesc'), status: 'configured' },
                { name: t('settings.apiKeys.stripe'), desc: t('settings.apiKeys.stripeDesc'), status: 'configured' },
                { name: t('settings.apiKeys.supabase'), desc: t('settings.apiKeys.supabaseDesc'), status: 'configured' },
              ].map(item => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {t('settings.apiKeys.serverSide')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


// ─── Subscription Tab Component ──────────────────────────────────────────────

function SubscriptionTab({ lang }: { lang: string }) {
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { data: sub, isLoading } = useSubscription();
  const portalMutation = useCreatePortalSession();

  const planNames: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  const handleManageSubscription = async () => {
    try {
      const data = await portalMutation.mutateAsync(window.location.href);
      window.location.href = data.portal_url;
    } catch {
      // Fallback — user might not have a subscription yet
    }
  };

  const renewalDate = sub?.current_period_end
    ? new Date(sub.current_period_end * 1000).toLocaleDateString(
        nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {nl ? 'Abonnement' : fr ? 'Abonnement' : 'Subscription'}
          </CardTitle>
          <CardDescription>
            {nl ? 'Beheer je abonnement en facturatie'
              : fr ? 'Gérez votre abonnement et facturation'
              : 'Manage your subscription and billing'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-sm text-gray-500">
                {nl ? 'Laden...' : fr ? 'Chargement...' : 'Loading...'}
              </span>
            </div>
          ) : (
            <>
              {/* Current Plan */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {planNames[sub?.plan || 'free'] || sub?.plan || 'Free'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          sub?.subscribed
                            ? 'text-green-600 border-green-200'
                            : 'text-gray-500 border-gray-300'
                        )}
                      >
                        {sub?.subscribed
                          ? (nl ? 'Actief' : fr ? 'Actif' : 'Active')
                          : (nl ? 'Gratis' : fr ? 'Gratuit' : 'Free')}
                      </Badge>
                      {sub?.cancel_at_period_end && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          {nl ? 'Wordt geannuleerd' : fr ? 'Sera annulé' : 'Canceling'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Renewal info */}
              {renewalDate && (
                <div className="text-sm text-gray-500">
                  {sub?.cancel_at_period_end
                    ? (nl ? `Toegang tot ${renewalDate}` : fr ? `Accès jusqu'au ${renewalDate}` : `Access until ${renewalDate}`)
                    : (nl ? `Verlenging op ${renewalDate}` : fr ? `Renouvellement le ${renewalDate}` : `Renews on ${renewalDate}`)}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {sub?.subscribed ? (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {portalMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {nl ? 'Abonnement beheren' : fr ? "Gérer l'abonnement" : 'Manage Subscription'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.location.href = '/pricing'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {nl ? 'Upgraden' : fr ? 'Mettre à niveau' : 'Upgrade Plan'}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


// ─── Social Media Tab Component ──────────────────────────────────────────────

const PLATFORM_CONFIG = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30' },
];

function SocialMediaTab({ lang }: { lang: string }) {
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { data: accounts = [], isLoading } = useSocialAccounts();
  const connectMutation = useConnectSocial();
  const disconnectMutation = useDisconnectSocial();

  const handleConnect = async (platform: string) => {
    try {
      const data = await connectMutation.mutateAsync(platform);
      window.location.href = data.authorization_url;
    } catch {
      // Error handled by mutation
    }
  };

  const getAccountForPlatform = (platform: string) =>
    accounts.find(a => a.platform === platform && a.status === 'active');

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {nl ? 'Social Media Accounts' : fr ? 'Comptes de Réseaux Sociaux' : 'Social Media Accounts'}
          </CardTitle>
          <CardDescription>
            {nl ? 'Koppel je social media accounts om direct te publiceren'
              : fr ? 'Connectez vos comptes de réseaux sociaux pour publier directement'
              : 'Connect your social media accounts to publish directly'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-sm text-gray-500">
                {nl ? 'Laden...' : fr ? 'Chargement...' : 'Loading...'}
              </span>
            </div>
          ) : (
            PLATFORM_CONFIG.map(platform => {
              const account = getAccountForPlatform(platform.id);
              const PlatformIcon = platform.icon;

              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${platform.bg} flex items-center justify-center`}>
                      <PlatformIcon className={`h-6 w-6 ${platform.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{platform.name}</p>
                      {account ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                            {nl ? 'Verbonden' : fr ? 'Connecté' : 'Connected'}
                          </Badge>
                          {account.account_name && (
                            <span className="text-xs text-gray-500">{account.account_name}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {nl ? 'Niet verbonden' : fr ? 'Non connecté' : 'Not connected'}
                        </p>
                      )}
                    </div>
                  </div>

                  {account ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(account.id)}
                      disabled={disconnectMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="h-4 w-4 mr-2" />
                      )}
                      {nl ? 'Ontkoppelen' : fr ? 'Déconnecter' : 'Disconnect'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={connectMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {nl ? 'Verbinden' : fr ? 'Connecter' : 'Connect'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-lg border-l-4 border-l-blue-500/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {nl ? 'OAuth Configuratie Vereist' : fr ? 'Configuration OAuth requise' : 'OAuth Configuration Required'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {nl ? 'Om social media accounts te koppelen, moeten LinkedIn en Meta Developer Apps geconfigureerd zijn met de juiste redirect URIs.'
                  : fr ? "Pour connecter des comptes de réseaux sociaux, les applications développeur LinkedIn et Meta doivent être configurées avec les URI de redirection corrects."
                  : 'To connect social media accounts, LinkedIn and Meta Developer Apps must be configured with the correct redirect URIs.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
