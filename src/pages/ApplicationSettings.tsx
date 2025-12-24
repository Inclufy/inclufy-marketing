import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Globe, 
  Key, 
  Palette, 
  Zap,
  Database,
  Shield,
  Code,
  Save,
  AlertCircle,
  CheckCircle,
  Link,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const ApplicationSettings = () => {
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    elevenlabs: "",
    google: ""
  });

  const [appSettings, setAppSettings] = useState({
    language: "en",
    timezone: "Europe/Amsterdam",
    dateFormat: "DD/MM/YYYY",
    autoSave: true,
    debugMode: false,
    analytics: true
  });

  const [integrations, setIntegrations] = useState({
    slack: { connected: false, webhook: "" },
    zapier: { connected: true, apiKey: "zap_***" },
    wordpress: { connected: false, url: "" },
    linkedin: { connected: true, profile: "inclufy-marketing" }
  });

  const handleSaveApiKeys = () => {
    toast.success("API keys updated successfully!");
  };

  const handleTestConnection = (service: string) => {
    toast.info(`Testing ${service} connection...`);
    setTimeout(() => {
      toast.success(`${service} connection successful!`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Application Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure your application preferences and integrations
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localization
              </CardTitle>
              <CardDescription>
                Set your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
                <Select value={appSettings.language} onValueChange={(value) => setAppSettings({...appSettings, language: value})}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="nl">Nederlands</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={appSettings.timezone} onValueChange={(value) => setAppSettings({...appSettings, timezone: value})}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Amsterdam">Amsterdam (GMT+1)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={appSettings.dateFormat} onValueChange={(value) => setAppSettings({...appSettings, dateFormat: value})}>
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Application Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Auto-save</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes as you work
                  </p>
                </div>
                <Switch 
                  checked={appSettings.autoSave}
                  onCheckedChange={(checked) => setAppSettings({...appSettings, autoSave: checked})}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Help us improve by sharing anonymous usage data
                  </p>
                </div>
                <Switch 
                  checked={appSettings.analytics}
                  onCheckedChange={(checked) => setAppSettings({...appSettings, analytics: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                AI Service API Keys
              </CardTitle>
              <CardDescription>
                Configure your AI service providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="openai">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai"
                    type="password"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                    placeholder="sk-..."
                  />
                  <Button variant="outline" onClick={() => handleTestConnection("OpenAI")}>
                    Test
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="anthropic">Anthropic API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="anthropic"
                    type="password"
                    value={apiKeys.anthropic}
                    onChange={(e) => setApiKeys({...apiKeys, anthropic: e.target.value})}
                    placeholder="sk-ant-..."
                  />
                  <Button variant="outline" onClick={() => handleTestConnection("Anthropic")}>
                    Test
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="elevenlabs">ElevenLabs API Key (TTS)</Label>
                <div className="flex gap-2">
                  <Input
                    id="elevenlabs"
                    type="password"
                    value={apiKeys.elevenlabs}
                    onChange={(e) => setApiKeys({...apiKeys, elevenlabs: e.target.value})}
                    placeholder="Your API key"
                  />
                  <Button variant="outline" onClick={() => handleTestConnection("ElevenLabs")}>
                    Test
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveApiKeys}>
                <Save className="mr-2 h-4 w-4" />
                Save API Keys
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>
                Monitor your API usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>OpenAI</span>
                    <span>$12.50 / $50.00</span>
                  </div>
                  <Progress value={25} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Anthropic</span>
                    <span>2,500 / 10,000 tokens</span>
                  </div>
                  <Progress value={25} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>ElevenLabs</span>
                    <span>45 / 100 minutes</span>
                  </div>
                  <Progress value={45} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <img src="/slack-logo.png" alt="Slack" className="h-5 w-5" />
                    Slack
                  </span>
                  <Badge variant={integrations.slack.connected ? "success" : "secondary"}>
                    {integrations.slack.connected ? "Connected" : "Not Connected"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Send notifications to Slack channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={integrations.slack.connected ? "outline" : "default"} className="w-full">
                  {integrations.slack.connected ? "Disconnect" : "Connect Slack"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Zapier
                  </span>
                  <Badge variant={integrations.zapier.connected ? "success" : "secondary"}>
                    {integrations.zapier.connected ? "Connected" : "Not Connected"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Automate workflows with 5000+ apps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={integrations.zapier.connected ? "outline" : "default"} className="w-full">
                  {integrations.zapier.connected ? "Manage Zaps" : "Connect Zapier"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    WordPress
                  </span>
                  <Badge variant={integrations.wordpress.connected ? "success" : "secondary"}>
                    {integrations.wordpress.connected ? "Connected" : "Not Connected"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Publish content directly to WordPress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={integrations.wordpress.connected ? "outline" : "default"} className="w-full">
                  {integrations.wordpress.connected ? "Disconnect" : "Connect WordPress"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    LinkedIn
                  </span>
                  <Badge variant={integrations.linkedin.connected ? "success" : "secondary"}>
                    {integrations.linkedin.connected ? "Connected" : "Not Connected"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Share content to LinkedIn automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={integrations.linkedin.connected ? "outline" : "default"} className="w-full">
                  {integrations.linkedin.connected ? "Manage Access" : "Connect LinkedIn"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Developer Settings
              </CardTitle>
              <CardDescription>
                Advanced settings for developers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Debug Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Show detailed error messages and logs
                  </p>
                </div>
                <Switch 
                  checked={appSettings.debugMode}
                  onCheckedChange={(checked) => setAppSettings({...appSettings, debugMode: checked})}
                />
              </div>

              <Separator />

              <div>
                <Label>Webhook URL</Label>
                <Input 
                  placeholder="https://your-domain.com/webhook"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Receive events when content is published
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Actions here cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                Reset All Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationSettings;