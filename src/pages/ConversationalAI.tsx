import { useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/DataState';
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
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [botStatus, setBotStatus] = useState<'online' | 'paused'>('online');
  const [testMessage, setTestMessage] = useState("");

  const performance: BotPerformance = {
    conversations: 0,
    qualified: 0,
    booked: 0,
    avgResponseTime: "–",
    satisfactionScore: 0
  };

  const activeConversations: Conversation[] = [];

  const botCapabilities = [
    {
      title: nl ? "Leadkwalificatie" : fr ? "Qualification des leads" : "Lead Qualification",
      description: nl ? "Identificeert waardevolle prospects" : fr ? "Identifie les prospects de grande valeur" : "Identifies high-value prospects",
      metrics: nl ? "31% beter dan formulieren" : fr ? "31% mieux que les formulaires" : "31% better than forms",
      icon: Target
    },
    {
      title: nl ? "Vergaderingen Boeken" : fr ? "Prise de rendez-vous" : "Meeting Booking",
      description: nl ? "Boekt demo's direct in agenda" : fr ? "Planifie les d\u00e9mos directement dans l'agenda" : "Books demos directly in calendar",
      metrics: nl ? "68% conversieratio" : fr ? "68% taux de conversion" : "68% conversion rate",
      icon: Calendar
    },
    {
      title: nl ? "24/7 Beschikbaar" : fr ? "Disponibilit\u00e9 24/7" : "24/7 Availability",
      description: nl ? "Mis nooit een lead" : fr ? "Ne manquez jamais un lead" : "Never miss a lead",
      metrics: nl ? "3x meer gesprekken" : fr ? "3x plus de conversations" : "3x more conversations",
      icon: Clock
    },
    {
      title: nl ? "Meertalig" : fr ? "Multilingue" : "Multi-language",
      description: nl ? "Ondersteunt 12 talen" : fr ? "Prend en charge 12 langues" : "Supports 12 languages",
      metrics: nl ? "Wereldwijd bereik" : fr ? "Port\u00e9e mondiale" : "Global reach",
      icon: MessageSquare
    }
  ];

  const conversationTemplates = [
    {
      name: nl ? "Websitebezoeker" : fr ? "Visiteur du site" : "Website Visitor",
      description: nl ? "Kwalificeer en boek demo's" : fr ? "Qualifier et r\u00e9server des d\u00e9mos" : "Qualify and book demos",
      topics: nl
        ? ["Productinteresse", "Pijnpunten", "Budget", "Tijdlijn"]
        : fr
        ? ["Int\u00e9r\u00eat produit", "Points de douleur", "Budget", "Calendrier"]
        : ["Product interest", "Pain points", "Budget", "Timeline"]
    },
    {
      name: nl ? "Onboarding Assistent" : fr ? "Assistant d'int\u00e9gration" : "Onboarding Assistant",
      description: nl ? "Begeleid nieuwe gebruikers" : fr ? "Guider les nouveaux utilisateurs" : "Guide new users",
      topics: nl
        ? ["Installatiehulp", "Functies ontdekken", "Best practices", "Snelle winsten"]
        : fr
        ? ["Aide \u00e0 la configuration", "D\u00e9couverte des fonctionnalit\u00e9s", "Bonnes pratiques", "Gains rapides"]
        : ["Setup help", "Feature discovery", "Best practices", "Quick wins"]
    },
    {
      name: nl ? "Support Bot" : fr ? "Bot de support" : "Support Bot",
      description: nl ? "Tier 1 support automatisering" : fr ? "Automatisation du support niveau 1" : "Tier 1 support automation",
      topics: nl
        ? ["Veelgestelde vragen", "Probleemoplossing", "Functieverzoeken", "Escalatie"]
        : fr
        ? ["FAQ", "D\u00e9pannage", "Demandes de fonctionnalit\u00e9s", "Escalade"]
        : ["FAQs", "Troubleshooting", "Feature requests", "Escalation"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            {nl ? 'Conversationele AI' : fr ? 'IA Conversationnelle' : 'Conversational AI'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {nl ? 'AI-verkoopmedewerker die bezoekers omzet in gekwalificeerde pipeline' : fr ? 'Assistant commercial IA qui convertit les visiteurs en pipeline qualifi\u00e9' : 'AI sales assistant that converts visitors into qualified pipeline'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={botStatus === 'online' ? 'success' : 'secondary'}>
            {botStatus === 'online' ? (nl ? 'Bot Online' : fr ? 'Bot en ligne' : 'Bot Online') : (nl ? 'Bot Gepauzeerd' : fr ? 'Bot en pause' : 'Bot Paused')}
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
            <CardTitle className="text-sm font-medium">{nl ? 'Gesprekken' : fr ? 'Conversations' : 'Conversations'}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.conversations}</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Deze maand' : fr ? 'Ce mois-ci' : 'This month'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Gekwalificeerde Leads' : fr ? 'Leads qualifi\u00e9s' : 'Qualified Leads'}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.qualified}</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Deze maand' : fr ? 'Ce mois-ci' : 'This month'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Geboekte Vergaderingen' : fr ? 'R\u00e9unions planifi\u00e9es' : 'Meetings Booked'}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.booked}</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Direct in agenda' : fr ? 'Directement dans l\'agenda' : 'Direct to calendar'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Reactietijd' : fr ? 'Temps de r\u00e9ponse' : 'Response Time'}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Gemiddeld' : fr ? 'Moyenne' : 'Average'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Tevredenheid' : fr ? 'Satisfaction' : 'Satisfaction'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.satisfactionScore}%</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Nog geen data' : fr ? 'Pas encore de données' : 'No data yet'}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="conversations">{nl ? 'Actieve Gesprekken' : fr ? 'Conversations actives' : 'Active Conversations'}</TabsTrigger>
          <TabsTrigger value="configuration">{nl ? 'Bot Configuratie' : fr ? 'Configuration du bot' : 'Bot Configuration'}</TabsTrigger>
          <TabsTrigger value="training">{nl ? 'Training & Optimalisatie' : fr ? 'Formation & Optimisation' : 'Training & Optimization'}</TabsTrigger>
          <TabsTrigger value="analytics">{nl ? 'Analyse' : fr ? 'Analytique' : 'Analytics'}</TabsTrigger>
        </TabsList>

        {/* Active Conversations */}
        <TabsContent value="conversations">
          {activeConversations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  title={nl ? 'Nog geen gesprekken' : fr ? 'Pas encore de conversations' : 'No conversations yet'}
                  description={nl ? 'Wanneer bezoekers met uw AI-assistent praten, verschijnen gesprekken hier.' : fr ? 'Lorsque les visiteurs discuteront avec votre assistant IA, les conversations apparaîtront ici.' : 'When visitors chat with your AI assistant, conversations will appear here.'}
                />
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{nl ? 'Live Gesprekken' : fr ? 'Conversations en direct' : 'Live Conversations'}</CardTitle>
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
                              {nl ? 'Score' : fr ? 'Score' : 'Score'}: {conv.score}%
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
                  <CardTitle>{nl ? 'Gesprek' : fr ? 'Conversation' : 'Conversation'}</CardTitle>
                  <CardDescription>{nl ? 'Selecteer een gesprek' : fr ? 'Sélectionnez une conversation' : 'Select a conversation'}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-1" />
                    {nl ? 'Bellen' : fr ? 'Appeler' : 'Call'}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    {nl ? 'E-mail' : fr ? 'E-mail' : 'Email'}
                  </Button>
                  <Button size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {nl ? 'Vergadering Boeken' : fr ? 'R\u00e9server une r\u00e9union' : 'Book Meeting'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {(activeConversations.find(c => c.id === selectedConversation)?.messages || []).map(msg => (
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
                    placeholder={nl ? "Typ een testbericht..." : fr ? "Tapez un message test..." : "Type a test message..."}
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
          )}
        </TabsContent>

        {/* Bot Configuration */}
        <TabsContent value="configuration">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Bot Mogelijkheden' : fr ? 'Capacit\u00e9s du bot' : 'Bot Capabilities'}</CardTitle>
                <CardDescription>
                  {nl ? 'Wat uw AI-assistent kan doen' : fr ? 'Ce que votre assistant IA peut faire' : 'What your AI assistant can do'}
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
                <CardTitle>{nl ? 'Gesprekssjablonen' : fr ? 'Mod\u00e8les de conversation' : 'Conversation Templates'}</CardTitle>
                <CardDescription>
                  {nl ? 'Voorgebouwde gespreksflows' : fr ? 'Flux de conversation pr\u00e9construits' : 'Pre-built conversation flows'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversationTemplates.map((template) => (
                    <div key={template.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Button size="sm" variant="outline">{nl ? 'Configureren' : fr ? 'Configurer' : 'Configure'}</Button>
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
              <CardTitle>{nl ? 'Installatie' : fr ? 'Installation' : 'Installation'}</CardTitle>
              <CardDescription>
                {nl ? 'Voeg de AI-assistent toe aan uw website' : fr ? 'Ajoutez l\'assistant IA \u00e0 votre site web' : 'Add the AI assistant to your website'}
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
                    {nl ? 'Code Kopi\u00ebren' : fr ? 'Copier le code' : 'Copy Code'}
                  </Button>
                  <Button variant="outline">
                    {nl ? 'Installatie Testen' : fr ? 'Tester l\'installation' : 'Test Installation'}
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
              <CardTitle>{nl ? 'AI Trainingscentrum' : fr ? 'Centre de formation IA' : 'AI Training Center'}</CardTitle>
              <CardDescription>
                {nl ? 'Train uw bot met merkkennis en gesprekspatronen' : fr ? 'Entra\u00eenez votre bot avec les connaissances de marque et les mod\u00e8les de conversation' : 'Train your bot with brand knowledge and conversation patterns'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Knowledge Sources */}
                <div>
                  <h4 className="font-medium mb-3">{nl ? 'Kennisbronnen' : fr ? 'Sources de connaissances' : 'Knowledge Sources'}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{nl ? 'Merk Kennisbank' : fr ? 'Base de connaissances de marque' : 'Brand Knowledge Base'}</p>
                          <p className="text-sm text-muted-foreground">{nl ? '0 documenten' : fr ? '0 documents' : '0 documents'}</p>
                        </div>
                      </div>
                      <Badge variant="success">{nl ? 'Gesynchroniseerd' : fr ? 'Synchronis\u00e9' : 'Synced'}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{nl ? 'Eerdere Gesprekken' : fr ? 'Conversations pass\u00e9es' : 'Past Conversations'}</p>
                          <p className="text-sm text-muted-foreground">{nl ? '0 voorbeelden' : fr ? '0 exemples' : '0 examples'}</p>
                        </div>
                      </div>
                      <Badge variant="success">{nl ? 'Training' : fr ? 'Formation' : 'Training'}</Badge>
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div>
                  <h4 className="font-medium mb-3">{nl ? 'AI Optimalisatiesuggesties' : fr ? 'Suggestions d\'optimisation IA' : 'AI Optimization Suggestions'}</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium">{nl ? 'Prijsinformatie toevoegen' : fr ? 'Ajouter des informations tarifaires' : 'Add pricing information'}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {nl ? '34% van de gesprekken vraagt naar prijzen maar de bot kan niet antwoorden' : fr ? '34% des conversations demandent les tarifs mais le bot ne peut pas r\u00e9pondre' : '34% of conversations ask about pricing but bot can\'t answer'}
                          </p>
                          <Button size="sm" className="mt-2">{nl ? 'Prijzen Toevoegen' : fr ? 'Ajouter les tarifs' : 'Add Pricing'}</Button>
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
              <CardTitle>{nl ? 'Gespreksanalyse' : fr ? 'Analytique des conversations' : 'Conversation Analytics'}</CardTitle>
              <CardDescription>
                {nl ? 'Diepgaande inzichten in de prestaties van uw AI-assistent' : fr ? 'Analyses approfondies des performances de votre assistant IA' : 'Deep insights into your AI assistant performance'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-xs text-gray-500 mt-1">{nl ? 'Gesprekken' : fr ? 'Conversations' : 'Conversations'}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-xs text-gray-500 mt-1">{nl ? 'Berichten' : fr ? 'Messages' : 'Messages'}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">0%</p>
                  <p className="text-xs text-gray-500 mt-1">{nl ? 'Oplossingspercentage' : fr ? 'Taux de r\u00e9solution' : 'Resolution Rate'}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">0s</p>
                  <p className="text-xs text-gray-500 mt-1">{nl ? 'Gem. Reactie' : fr ? 'R\u00e9ponse moy.' : 'Avg Response'}</p>
                </div>
              </div>
              <div className="h-[250px] flex items-center justify-center text-muted-foreground border rounded-lg">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-10 w-10 mx-auto text-gray-300" />
                  <p className="text-sm">{nl ? 'Start gesprekken om analysegegevens te zien' : fr ? 'D\u00e9marrez des conversations pour voir les donn\u00e9es analytiques' : 'Start conversations to see analytics data'}</p>
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