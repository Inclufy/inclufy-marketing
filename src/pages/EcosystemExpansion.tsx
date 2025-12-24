import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Blocks, 
  Users, 
  GraduationCap, 
  Globe,
  Award,
  Building,
  Code,
  BookOpen,
  TrendingUp,
  Star,
  Briefcase,
  DollarSign,
  ChevronRight,
  CheckCircle
} from "lucide-react";

const EcosystemExpansion = () => {
  const [selectedView, setSelectedView] = useState("partners");

  const partners = [
    {
      name: "Digital Transform Co",
      tier: "platinum",
      clients: 127,
      revenue: "$2.3M",
      rating: 4.9
    },
    {
      name: "MarketingPro Solutions",
      tier: "gold",
      clients: 89,
      revenue: "$1.2M",
      rating: 4.8
    },
    {
      name: "Growth Accelerators",
      tier: "gold",
      clients: 76,
      revenue: "$980K",
      rating: 4.7
    },
    {
      name: "AI Marketing Agency",
      tier: "silver",
      clients: 45,
      revenue: "$560K",
      rating: 4.6
    }
  ];

  const courses = [
    {
      title: "Inclufy Fundamentals",
      level: "Beginner",
      enrolled: 3456,
      rating: 4.8,
      duration: "2 hours"
    },
    {
      title: "Advanced AI Orchestration",
      level: "Advanced",
      enrolled: 892,
      rating: 4.9,
      duration: "4 hours"
    },
    {
      title: "Revenue Intelligence Mastery",
      level: "Expert",
      enrolled: 456,
      rating: 4.9,
      duration: "6 hours"
    },
    {
      title: "Agency Partner Program",
      level: "Partner",
      enrolled: 234,
      rating: 4.7,
      duration: "3 hours"
    }
  ];

  const industryAgents = [
    {
      name: "Retail AI Agent",
      industry: "Retail & E-commerce",
      deployments: 234,
      accuracy: 92,
      status: "active"
    },
    {
      name: "Financial Services Agent",
      industry: "Banking & Finance",
      deployments: 89,
      accuracy: 94,
      status: "active"
    },
    {
      name: "Healthcare Agent",
      industry: "Healthcare & Pharma",
      deployments: 56,
      accuracy: 96,
      status: "active"
    },
    {
      name: "B2B Enterprise Agent",
      industry: "B2B & SaaS",
      deployments: 0,
      accuracy: 0,
      status: "coming"
    }
  ];

  const tierBenefits = {
    bronze: { color: "orange", revenue: "15%", support: "Standard", training: "Basic" },
    silver: { color: "gray", revenue: "20%", support: "Priority", training: "Advanced" },
    gold: { color: "yellow", revenue: "25%", support: "Dedicated", training: "Expert" },
    platinum: { color: "purple", revenue: "30%", support: "White Glove", training: "Custom" }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Blocks className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Ecosystem & Expansion</h1>
            <p className="text-muted-foreground">Build and grow with our partner network</p>
          </div>
        </div>
        <Button size="lg" className="gap-2">
          <Briefcase className="h-5 w-5" />
          Become a Partner
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partner Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">412</div>
            <p className="text-xs text-green-600">+52 this quarter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Academy Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,547</div>
            <p className="text-xs text-muted-foreground">2,156 certified</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Industry Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 in beta</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partner Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$5.2M</div>
            <p className="text-xs text-green-600">40% of total ARR</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        {['partners', 'academy', 'agents', 'whitelabel'].map((view) => (
          <Button
            key={view}
            variant={selectedView === view ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView(view)}
            className="capitalize"
          >
            {view === 'whitelabel' ? 'White Label' : view}
          </Button>
        ))}
      </div>

      {/* Partner Program */}
      {selectedView === 'partners' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Partner Leaderboard</CardTitle>
              <CardDescription>Top performing partners this quarter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {partners.map((partner, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {index < 3 && <Award className={`h-4 w-4 text-${tierBenefits[partner.tier].color}-600`} />}
                        {partner.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {partner.clients} clients • {partner.revenue} revenue
                      </p>
                    </div>
                    <Badge 
                      variant={partner.tier === 'platinum' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {partner.tier}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < Math.floor(partner.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{partner.rating}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partner Tiers</CardTitle>
              <CardDescription>Benefits and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(tierBenefits).map(([tier, benefits]) => (
                <div key={tier} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize flex items-center gap-2">
                      <Award className={`h-4 w-4 text-${benefits.color}-600`} />
                      {tier} Tier
                    </h4>
                    <Badge variant="outline">{benefits.revenue} revenue share</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Support: </span>
                      <span>{benefits.support}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Training: </span>
                      <span>{benefits.training}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Academy */}
      {selectedView === 'academy' && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Popular Courses</CardTitle>
                <CardDescription>Most enrolled certification programs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.map((course, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          {course.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.enrolled} enrolled • {course.duration}
                        </p>
                      </div>
                      <Badge variant={course.level === 'Partner' ? 'default' : 'outline'}>
                        {course.level}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${
                              i < Math.floor(course.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">{course.rating}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        Enroll
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Paths</CardTitle>
                <CardDescription>Structured certification programs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Marketer Path</h4>
                  <Progress value={65} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">8 courses • 24 hours • User to Expert</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Developer Path</h4>
                  <Progress value={30} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">6 courses • 18 hours • API to Apps</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Agency Path</h4>
                  <Progress value={45} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">10 courses • 30 hours • Partner Success</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Industry Agents */}
      {selectedView === 'agents' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry-Specific AI Agents</CardTitle>
              <CardDescription>Pre-trained models for vertical markets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {industryAgents.map((agent, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Code className="h-8 w-8 text-primary" />
                      {agent.status === 'active' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Coming Soon</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{agent.industry}</p>
                    {agent.status === 'active' && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Deployments</span>
                          <span className="font-medium">{agent.deployments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accuracy</span>
                          <span className="font-medium">{agent.accuracy}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fine-Tuning Studio</CardTitle>
              <CardDescription>Train custom AI models for your industry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Custom AI Training Available</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Train specialized models with your industry data for unmatched accuracy and compliance
                </p>
                <Button>Start Training</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* White Label */}
      {selectedView === 'whitelabel' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>White Label Platform</CardTitle>
              <CardDescription>Your brand, our technology</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-6 border rounded-lg">
                  <Globe className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Starter</h4>
                  <p className="text-2xl font-bold mb-2">$999/mo</p>
                  <p className="text-sm text-muted-foreground">Up to 50 users</p>
                  <ul className="text-sm text-left mt-4 space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Custom branding
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Your domain
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Basic support
                    </li>
                  </ul>
                </div>
                <div className="text-center p-6 border-2 border-primary rounded-lg">
                  <Building className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Professional</h4>
                  <p className="text-2xl font-bold mb-2">$2,999/mo</p>
                  <p className="text-sm text-muted-foreground">Up to 200 users</p>
                  <ul className="text-sm text-left mt-4 space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Everything in Starter
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      API access
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Priority support
                    </li>
                  </ul>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <DollarSign className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Enterprise</h4>
                  <p className="text-2xl font-bold mb-2">Custom</p>
                  <p className="text-sm text-muted-foreground">Unlimited users</p>
                  <ul className="text-sm text-left mt-4 space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Everything in Pro
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Dedicated instance
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      SLA guarantee
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active White Labels</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-muted-foreground">Across 12 countries</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Combined MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$423K</p>
                <p className="text-xs text-green-600">+34% QoQ</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total End Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">12.4K</p>
                <p className="text-xs text-muted-foreground">Growing 23% monthly</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcosystemExpansion;