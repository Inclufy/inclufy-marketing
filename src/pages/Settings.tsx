// src/pages/Settings.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings as SettingsIcon, Bell, Moon, Globe, Key, CreditCard, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [campaignAlerts, setCampaignAlerts] = useState(true);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: 'Settings saved' });
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure your workspace preferences</p>
      </div>

      {/* Notifications */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive email updates about your campaigns</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Campaign Alerts</p>
              <p className="text-xs text-gray-500">Get notified when campaigns complete</p>
            </div>
            <Switch checked={campaignAlerts} onCheckedChange={setCampaignAlerts} />
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>Manage API keys for integrations (configured server-side)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium">OpenAI</p>
              <p className="text-xs text-gray-500">Powers AI content generation</p>
            </div>
            <Badge variant="outline">Server-side</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium">Email Provider</p>
              <p className="text-xs text-gray-500">SendGrid or Resend for email delivery</p>
            </div>
            <Badge variant="outline">Server-side</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium">Stripe</p>
              <p className="text-xs text-gray-500">Payment processing</p>
            </div>
            <Badge variant="outline">Server-side</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/pricing">
            <Button variant="outline">View Plans & Pricing</Button>
          </Link>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Save Settings
      </Button>
    </div>
  );
}
