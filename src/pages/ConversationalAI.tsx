import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Bot,
  MessageSquare,
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Code,
  Play,
  Pause,
  Send,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Sparkles,
  Building,
  User,
  Clock,
  Target
} from "lucide-react";

interface Conversation {
  id: string;
  visitor: {
    name: string;
    email?: string;
    company?: string;
  };
  status: 'active' | 'qualified' | 'booked' | 'closed';
  score: number;
  messages: Message[];
  startedAt: Date;
  lastActivity: Date;
}

interface Message {
  id: string;
  sender: 'bot' | 'visitor';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface BotPerformance {
  conversations: number;
  qualified: number;
  booked: number;
  avgResponseTime: string;
  satisfactionScore: number;
}

const ConversationalAI = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [botStatus, setBotStatus] = useState<'online' | 'paused'>('online');
  const [testMessage, setTestMessage] = useState("");

  const performance: BotPerformance = {
    conversations: 2847,
    qualified: 892,
    booked: 234,
    avgResponseTime: "1.2s",
    satisfactionScore: 94
  };

  const activeConversations: Conversation[] = [
    {
      id: '1',
      visitor: {
        name: 'John Smith',
        email: 'john@techcorp.com',
        company: 'TechCorp Inc.'
      },
      status: 'active',
      score: 85,
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      lastActivity: new Date(),
      messages: [
        {
          id: 'm1',
          sender: 'bot',
          content: "Hi there! 👋 I'm Ava from Inclufy Marketing. I see you're exploring our AI-powered marketing platform. What brings you here today?",
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          id: 'm2',
          sender: 'visitor',
          content: "Hi! We're looking for a solution to help us create marketing content faster. We're spending too much time on repetitive tasks.",
          timestamp: new Date(Date.now() - 4 * 60 * 1000)
        },
        {
          id: 'm3',
          sender: 'bot',
          content: "I completely understand! Many of our customers came to us with the same challenge. Can you tell me what type of content you create most often? Email campaigns, social posts, or something else?",
          timestamp: new Date(Date.now() - 3 * 60 * 1000)
        },
        {
          id: 'm4',
          sender: 'visitor',
          content: "Mostly email campaigns and landing pages. We run about 10-15 campaigns per month.",
          timestamp: new Date(Date.now() - 2 * 60 * 1000)
        },
        {
          id: 'm5',
          sender: 'bot',
          content: "Perfect! With that volume, Inclufy could save your team about 20-30 hours per month. Our AI can generate complete email campaigns with A/B variants in minutes. Would you like to see how it works with a quick demo?",
          timestamp: new Date(Date.now() - 1 * 60 * 1000)
        },
        {
          id: 'm6',
          sender: 'visitor',
          content: "Yes, that would be great!",
          timestamp: new Date()
        }
      ]
    },
    {
      id: '2',
      visitor: {
        name: 'Sarah Johnson',
        company: 'StartupXYZ'
      },
      status: 'qualified',
      score: 92,
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      lastActivity: new Date(Date.now() - 3 * 60 * 1000),
      messages: []
    }
  ];

  const botCapabilities = [
    {
      title: "Lead Qualification",
      description: "Identifies high-value prospects",
      metrics: "31% better than forms",
      icon: Target
    },
    {
      title: "Meeting Booking",
      description: "Books demos directly in calendar",
      metrics: "68% conversion rate",
      icon: Calendar
    },
    {
      title: "24/7 Availability",
      description: "Never miss a lead",
      metrics: "3x more conversations",
      icon: Clock
    },
    {
      title: "Multi-language",
      description: "Supports 12 languages",
      metrics: "Global reach",
      icon: MessageSquare
    }
  ];

  const conversationTemplates = [
    {
      name: "Website Visitor",
      description: "Qualify and book demos",
      topics: ["Product interest", "Pain points", "Budget", "Timeline"]
    },
    {
      name: "Onboarding Assistant",
      description: "Guide new users",
      topics: ["Setup help", "Feature discovery", "Best practices", "Quick wins"]
    },
    {
      name: "Support Bot",
      description: "Tier 1 support automation",
      topics: ["FAQs", "Troubleshooting", "Feature requests", "Escalation"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Conversational AI
          </h2>
          <p className="text-muted-foreground mt-2">
            AI sales assistant that converts visitors into qualified pipeline
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={botStatus === 'online' ? 'success' : 'secondary'}>
            {botStatus === 'online' ? 'Bot Online' : 'Bot Paused'}
          </Badge>
          <Switch
            checked={botStatus === 'online'}
            onCheckedChange={(checked) => setBotStatus(checked ? 'online' : 'paused')}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.conversations}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.qualified}</div>
            <p className="text-xs text-muted-foreground text-green-600">31% conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.booked}</div>
            <p className="text-xs text-muted-foreground">Direct to calendar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.satisfactionScore}%</div>
            <p className="text-xs text-muted-foreground text-green-600">Excellent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="conversations">Active Conversations</TabsTrigger>
          <TabsTrigger value="configuration">Bot Configuration</TabsTrigger>
          <TabsTrigger value="training">Training & Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Active Conversations */}
        <TabsContent value="conversations">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Live Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {activeConversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conv.id 
                            ? 'bg-primary/10 border border-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {conv.visitor.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{conv.visitor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {conv.visitor.company}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              conv.status === 'active' ? 'default' :
                              conv.status === 'qualified' ? 'success' :
                              'secondary'
                            } className="text-xs">
                              {conv.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Score: {conv.score}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Conversation View */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Conversation with John Smith</CardTitle>
                  <CardDescription>TechCorp Inc. • Score: 85%</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Book Meeting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {activeConversations[0].messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[80%] ${msg.sender === 'bot' ? 'order-2' : 'order-1'}`}>
                          <div className={`rounded-lg p-3 ${
                            msg.sender === 'bot' 
                              ? 'bg-muted' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.sender === 'bot' && (
                          <Avatar className="h-8 w-8 order-1 mr-2">
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Test Input */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    placeholder="Type a test message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bot Configuration */}
        <TabsContent value="configuration">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>Bot Capabilities</CardTitle>
                <CardDescription>
                  What your AI assistant can do
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {botCapabilities.map((capability) => (
                    <div key={capability.title} className="flex gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 h-fit">
                        <capability.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{capability.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {capability.description}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {capability.metrics}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Templates</CardTitle>
                <CardDescription>
                  Pre-built conversation flows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversationTemplates.map((template) => (
                    <div key={template.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>
                Add the AI assistant to your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
                  {`<script src="https://cdn.inclufy.com/ai-chat.js"></script>
<script>
  IncluifyChat.init({
    botId: 'your-bot-id',
    position: 'bottom-right',
    primaryColor: '#6366f1'
  });
</script>`}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Code className="mr-2 h-4 w-4" />
                    Copy Code
                  </Button>
                  <Button variant="outline">
                    Test Installation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training & Optimization */}
        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>AI Training Center</CardTitle>
              <CardDescription>
                Train your bot with brand knowledge and conversation patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Knowledge Sources */}
                <div>
                  <h4 className="font-medium mb-3">Knowledge Sources</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Brand Knowledge Base</p>
                          <p className="text-sm text-muted-foreground">247 documents</p>
                        </div>
                      </div>
                      <Badge variant="success">Synced</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Past Conversations</p>
                          <p className="text-sm text-muted-foreground">2,847 examples</p>
                        </div>
                      </div>
                      <Badge variant="success">Training</Badge>
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div>
                  <h4 className="font-medium mb-3">AI Optimization Suggestions</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Add pricing information</p>
                          <p className="text-sm text-gray-600 mt-1">
                            34% of conversations ask about pricing but bot can't answer
                          </p>
                          <Button size="sm" className="mt-2">Add Pricing</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Analytics</CardTitle>
              <CardDescription>
                Deep insights into your AI assistant performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-xs text-gray-500 mt-1">Conversations</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-xs text-gray-500 mt-1">Messages</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">0%</p>
                  <p className="text-xs text-gray-500 mt-1">Resolution Rate</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">0s</p>
                  <p className="text-xs text-gray-500 mt-1">Avg Response</p>
                </div>
              </div>
              <div className="h-[250px] flex items-center justify-center text-muted-foreground border rounded-lg">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-10 w-10 mx-auto text-gray-300" />
                  <p className="text-sm">Start conversations to see analytics data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConversationalAI;