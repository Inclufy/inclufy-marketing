import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  Sparkles,
  Mail, 
  Globe, 
  Share2,
  Video,
  BarChart3,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle,
  Target,
  RefreshCw,
  TestTube
} from "lucide-react";

const Phase2Overview = () => {
  const phase2Features = [
    {
      title: "Email Campaign Generator",
      description: "High-converting emails with A/B testing",
      icon: Mail,
      href: "/email-campaigns",
      status: "new",
      metrics: {
        label: "Avg. Open Rate",
        value: "32%",
        change: "+12%"
      },
      capabilities: [
        "5 campaign types",
        "A/B testing built-in",
        "Personalization tokens",
        "Performance analysis"
      ]
    },
    {
      title: "Landing Page Copy",
      description: "Conversion-optimized page sections",
      icon: Globe,
      href: "/landing-pages",
      status: "new",
      metrics: {
        label: "Conversion Rate",
        value: "14%",
        change: "+8%"
      },
      capabilities: [
        "6 page templates",
        "Section-by-section generation",
        "Mobile-optimized",
        "SEO-friendly"
      ]
    },
    {
      title: "Social Post Generator",
      description: "Platform-optimized social content",
      icon: Share2,
      href: "/social-posts",
      status: "enhanced",
      metrics: {
        label: "Engagement Rate",
        value: "5.2%",
        change: "+3.1%"
      },
      capabilities: [
        "Multi-platform support",
        "Hashtag research",
        "Visual suggestions",
        "Scheduling ready"
      ]
    },
    {
      title: "Commercial Scripts",
      description: "Video scripts that convert",
      icon: Video,
      href: "/commercial-creator",
      status: "enhanced",
      metrics: {
        label: "View Completion",
        value: "68%",
        change: "+15%"
      },
      capabilities: [
        "Multiple formats",
        "Voice-over ready",
        "Timing markers",
        "Emotion mapping"
      ]
    }
  ];

  const contentAnalyzer = {
    title: "Content Analyzer & Improver",
    description: "The AI that keeps improving your marketing",
    capabilities: [
      {
        title: "Performance Scoring",
        description: "Get instant feedback on any content",
        icon: BarChart3
      },
      {
        title: "Smart Improvements",
        description: "One-click optimization for your goals",
        icon: Sparkles
      },
      {
        title: "Before/After Proof",
        description: "See exactly how AI improves results",
        icon: TrendingUp
      },
      {
        title: "Continuous Learning",
        description: "Gets better with every use",
        icon: RefreshCw
      }
    ]
  };

  const phase2Stats = [
    { label: "Content Types", value: "4", icon: Zap },
    { label: "A/B Testing", value: "✓", icon: TestTube },
    { label: "Time Saved", value: "20h/week", icon: Target },
    { label: "ROI Increase", value: "+240%", icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Phase 2: Core Monetization
          </h2>
          <p className="text-muted-foreground mt-2">
            High-impact content generators that drive revenue
          </p>
        </div>
        <Badge variant="default" className="text-sm">
          Weeks 8-16
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {phase2Stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Creation Suite */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          Priority 4: AI Content Creation Suite
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {phase2Features.map((feature) => (
            <Card key={feature.title} className="relative overflow-hidden">
              {feature.status === "new" && (
                <Badge className="absolute top-4 right-4" variant="default">
                  New
                </Badge>
              )}
              {feature.status === "enhanced" && (
                <Badge className="absolute top-4 right-4" variant="secondary">
                  Enhanced
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{feature.metrics.label}</span>
                    <span className="font-medium">{feature.metrics.value}</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {feature.metrics.change} vs last month
                  </div>
                </div>

                {/* Capabilities */}
                <div className="space-y-1">
                  {feature.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>

                <Link to={feature.href}>
                  <Button className="w-full">
                    <span>Start Creating</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Analyzer & Improver */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Priority 5: {contentAnalyzer.title}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {contentAnalyzer.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Closes the value loop
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {contentAnalyzer.capabilities.map((capability) => (
              <div key={capability.title} className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <capability.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{capability.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Value Demonstration */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-3">Before vs After Impact</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Email Open Rate</span>
                  <span className="text-green-600">+47%</span>
                </div>
                <Progress value={47} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Landing Page Conversion</span>
                  <span className="text-green-600">+62%</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Social Engagement</span>
                  <span className="text-green-600">+89%</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 Implementation</CardTitle>
          <CardDescription>
            Focus on high-impact, revenue-driving features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                W8
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Email Campaign Generator</h4>
                <p className="text-sm text-muted-foreground">
                  Launch with A/B testing capabilities
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                W10
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Landing Page Copy Generator</h4>
                <p className="text-sm text-muted-foreground">
                  6 templates for different conversion goals
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                W12
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Enhanced Social & Video</h4>
                <p className="text-sm text-muted-foreground">
                  Platform optimization and analytics
                </p>
              </div>
              <div className="w-5 h-5" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                W14
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Content Analyzer & Improver</h4>
                <p className="text-sm text-muted-foreground">
                  AI feedback loop for continuous improvement
                </p>
              </div>
              <div className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">
              Ready to 10x Your Marketing Output?
            </h3>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Phase 2 transforms Inclufy from a tool to an indispensable marketing partner.
              Start with email campaigns and watch your metrics soar.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link to="/email-campaigns">
                <Button size="lg" variant="secondary">
                  Start with Email Campaigns
                  <Mail className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/landing-pages">
                <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Create Landing Pages
                  <Globe className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase2Overview;