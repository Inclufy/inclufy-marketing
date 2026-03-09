import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings,
  Mail,
  MoreVertical,
  Building,
  CreditCard,
  Activity,
  CheckCircle,
  AlertCircle,
  Crown,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'inactive';
  avatar?: string;
  lastActive: string;
}

const TeamSettings = () => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sami Inclufy',
      email: 'sami@inclufy.com',
      role: 'owner',
      status: 'active',
      lastActive: 'Online now'
    }
  ]);

  const handleInvite = () => {
    if (!inviteEmail) return;
    toast.info("Coming soon — team invites are not yet available.");
    setInviteEmail("");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      owner: "default",
      admin: "secondary",
      member: "outline"
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "secondary"> = {
      active: "success",
      invited: "warning",
      inactive: "secondary"
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Settings</h2>
          <p className="text-muted-foreground mt-2">
            Manage your team members and permissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            <Users className="mr-1 h-3 w-3" />
            {teamMembers.length} / 10 seats
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="billing">Team Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members" className="space-y-6">
          {/* Invite Member */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Team Member
              </CardTitle>
              <CardDescription>
                Add new members to collaborate on your marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite}>
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last active: {member.lastActive}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Invite
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Configure what each role can do in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Owner Permissions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold">Owner</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Full access to all features</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Manage billing and subscription</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Delete workspace</span>
                    </div>
                  </div>
                </div>

                {/* Admin Permissions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Admin</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Create and edit all content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Manage team members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span>Cannot manage billing</span>
                    </div>
                  </div>
                </div>

                {/* Member Permissions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold">Member</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Create and edit own content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>View all content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span>Cannot invite new members</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Team Subscription
              </CardTitle>
              <CardDescription>
                Manage your team's subscription and seats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">Team Plan</h4>
                  <p className="text-sm text-muted-foreground">10 seats included</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">€499/month</p>
                  <p className="text-sm text-muted-foreground">Billed monthly</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active seats</span>
                  <span className="font-medium">{teamMembers.length} / 10</span>
                </div>
                <Progress value={teamMembers.length * 10} />
                <p className="text-xs text-muted-foreground">
                  {10 - teamMembers.length} seats available
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Add More Seats
                </Button>
                <Button variant="outline" className="flex-1">
                  Change Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>
                Team resource consumption this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Credits Used</span>
                  <span className="font-medium">0 / 20,000</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Storage Used</span>
                  <span className="font-medium">0 GB / 50 GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>API Calls</span>
                  <span className="font-medium">0 / 100,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Team Activity
              </CardTitle>
              <CardDescription>
                Track what your team has been working on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Activity className="h-10 w-10 mx-auto text-gray-300" />
                  <p className="text-sm text-muted-foreground">No team activity yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamSettings;