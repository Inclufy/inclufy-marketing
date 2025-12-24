import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Globe, 
  Presentation, 
  TrendingUp,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  BarChart3,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const quickActions = [
    {
      title: "Setup Brand Memory",
      description: "Define your brand voice and knowledge base",
      icon: Brain,
      href: "/brand-memory",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Analyze Website",
      description: "Extract insights from any website",
      icon: Globe,
      href: "/website-analyzer",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Generate Presentation",
      description: "Create AI-powered sales decks",
      icon: Presentation,
      href: "/presentation-generator",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const stats = [
    {
      title: "Content Created",
      value: "24",
      change: "+12%",
      icon: FileText,
    },
    {
      title: "Presentations",
      value: "8",
      change: "+25%",
      icon: Presentation,
    },
    {
      title: "Team Members",
      value: "5",
      change: "+2",
      icon: Users,
    },
    {
      title: "AI Credits Used",
      value: "1,250",
      change: "75%",
      icon: Sparkles,
    },
  ];

  const recentActivity = [
    {
      title: "Sales Presentation for Acme Corp",
      time: "2 hours ago",
      icon: Presentation,
      status: "completed",
    },
    {
      title: "Website Analysis - competitor.com",
      time: "5 hours ago",
      icon: Globe,
      status: "completed",
    },
    {
      title: "Brand Voice Update",
      time: "1 day ago",
      icon: Brain,
      status: "completed",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your marketing automation today.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Phase 1 - Foundation Active
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Start with these essential features to power up your marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link to={action.href} key={action.title}>
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${action.bgColor}`}>
                        <action.icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Phase 1 Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Phase 1 Progress
            </CardTitle>
            <CardDescription>
              Foundation & Differentiation Setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Brand Memory Setup</span>
                <span className="text-muted-foreground">60%</span>
              </div>
              <Progress value={60} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Website Analyzer Configuration</span>
                <span className="text-muted-foreground">30%</span>
              </div>
              <Progress value={30} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Presentation Templates</span>
                <span className="text-muted-foreground">45%</span>
              </div>
              <Progress value={45} />
            </div>
            <div className="pt-4">
              <Button asChild className="w-full">
                <Link to="/brand-memory">Continue Setup</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest marketing activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 pb-4 last:pb-0 border-b last:border-0"
                >
                  <div className={`p-2 rounded-lg bg-${activity.status === 'completed' ? 'green' : 'blue'}-100`}>
                    <activity.icon className={`h-4 w-4 text-${activity.status === 'completed' ? 'green' : 'blue'}-600`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  {activity.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content Performance
          </CardTitle>
          <CardDescription>
            Track the impact of your AI-generated content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>Performance analytics coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;