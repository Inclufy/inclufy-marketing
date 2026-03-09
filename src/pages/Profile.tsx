// src/pages/Profile.tsx
// Profiel pagina — redirect naar Instellingen (Profiel tab)
// Of standalone profiel overzicht

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User, Mail, Building2, Calendar, Shield, Loader2, Settings,
  Briefcase, MapPin, Globe, Phone, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const fullName = user?.user_metadata?.full_name || 'Sami Admin';
  const email = user?.email || 'sami@inclufy.com';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(lang === 'nl' ? 'nl-NL' : lang === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : 'Januari 2025';

  const firstName = fullName.split(' ')[0] || 'Sami';
  const lastName = fullName.split(' ').slice(1).join(' ') || 'Admin';

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: t('settings.profile.saved') });
    }, 500);
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            {t('nav.profile')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {lang === 'nl' ? 'Je profiel overzicht' : lang === 'fr' ? 'Aperçu de votre profil' : 'Your profile overview'}
          </p>
        </div>
        <Link to="/app/settings">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            {t('nav.settings')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
          </div>
        </div>

        <CardContent className="relative px-6 pb-6">
          {/* Avatar - overlapping banner */}
          <div className="-mt-14 mb-4 flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900 shadow-lg">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {firstName} {lastName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{email}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('settings.profile.role')}</p>
                <p className="text-sm font-medium">Superadmin</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('settings.profile.company')}</p>
                <p className="text-sm font-medium">Inclufy</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('settings.profile.memberSince')}</p>
                <p className="text-sm font-medium">{createdAt}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Locatie</p>
                <p className="text-sm font-medium">Amsterdam, NL</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                <p className="text-sm font-medium">Enterprise</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Globe className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('settings.preferences.language')}</p>
                <p className="text-sm font-medium">{lang === 'nl' ? 'Nederlands' : lang === 'fr' ? 'Français' : 'English'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">12</p>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'nl' ? 'Actieve Campagnes' : lang === 'fr' ? 'Campagnes Actives' : 'Active Campaigns'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-600">2,847</p>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'nl' ? 'Contacten' : 'Contacts'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">156</p>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'nl' ? 'Content Items' : lang === 'fr' ? 'Éléments de Contenu' : 'Content Items'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
