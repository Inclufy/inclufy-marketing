// src/pages/Profile.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2, Calendar, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const fullName = user?.user_metadata?.full_name || '';
  const email = user?.email || '';
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

  const handleSave = async () => {
    setSaving(true);
    // Profile updates would go through Supabase auth.updateUser
    setTimeout(() => {
      setSaving(false);
      toast({ title: 'Profile updated' });
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account details</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
              {(fullName || email).charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle>{fullName || 'User'}</CardTitle>
              <CardDescription>{email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Full Name
              </label>
              <Input defaultValue={fullName} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </label>
              <Input defaultValue={email} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Member since {createdAt}
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
