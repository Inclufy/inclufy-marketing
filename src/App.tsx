// src/App.tsx
import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Lazy-loaded pages (code-splitting)
const Homepage = lazy(() => import("./pages/Homepage"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const LuxuryDashboard = lazy(() => import("@/pages/LuxuryDashboard"));
const Analytics = lazy(() => import("@/pages/dashboard/Analytics"));
const Reports = lazy(() => import("@/pages/dashboard/Reports"));
const QuickStart = lazy(() => import("@/pages/QuickStart"));
const BrandSetup = lazy(() => import("@/pages/setup/BrandSetup"));
const TargetAudience = lazy(() => import("@/pages/setup/TargetAudience"));
const CompetitiveAnalysisSetup = lazy(() => import("@/pages/setup/CompetitiveAnalysisSetup"));
const GoalsAndKPIs = lazy(() => import("@/strategy/components/GoalsAndKPIs"));
const ContextMarketing = lazy(() => import("@/pages/ContextMarketing"));
const BrandMemory = lazy(() => import("./pages/BrandMemory"));
const MarketIntelligence = lazy(() => import("@/pages/MarketIntelligence"));
const MarketInsights = lazy(() => import("@/pages/intelligence/growth-blueprint/MarketInsights"));
const WebsiteAnalyzer = lazy(() => import("./pages/WebsiteAnalyzer"));
const PresentationGenerator = lazy(() => import("@/pages/PresentationGenerator"));
const GrowthBlueprint = lazy(() => import("./pages/growth-blueprint/GrowthBlueprint"));
const EmailCampaignGenerator = lazy(() => import("./pages/EmailCampaignGenerator"));
const LandingPageGenerator = lazy(() => import("./pages/LandingPageGenerator"));
const SocialPostGenerator = lazy(() => import("./pages/SocialPostGenerator"));
const JourneyBuilder = lazy(() => import("./pages/JourneyBuilder"));
const CampaignOrchestrator = lazy(() => import("./pages/CampaignOrchestrator"));
const ConversationalAI = lazy(() => import("./pages/ConversationalAI"));
const AITrainingInterface = lazy(() => import("./pages/AITrainingInterface"));
const TutorialCreator = lazy(() => import("./pages/TutorialCreator"));
const CommercialCreator = lazy(() => import("./pages/CommercialCreator"));
const ContentLibrary = lazy(() => import("./pages/ContentLibrary"));
const MediaLibrary = lazy(() => import("./pages/MediaLibrary"));
const BrandKits = lazy(() => import("./pages/BrandKits"));
const RevenueIntelligence = lazy(() => import("./pages/RevenueIntelligence"));
const EnterpriseGovernance = lazy(() => import("./pages/EnterpriseGovernance"));
const EcosystemExpansion = lazy(() => import("./pages/EcosystemExpansion"));
const ContactManager = lazy(() => import("./pages/ContactManager"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AIWriter = lazy(() => import("./pages/AIWriter"));
const ImageGenerator = lazy(() => import("./pages/ImageGenerator"));

// Layouts
const LuxuryTopNavLayout = lazy(() => import("@/components/layouts/LuxuryTopNavLayout"));
const AuthLayout = lazy(() => import("@/layouts/AuthLayout"));

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

// Main App component
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* PUBLIC ROUTES */}
                    <Route path="/" element={<Homepage />} />
                    <Route path="/pricing" element={<PricingPage />} />

                    {/* AUTH ROUTES - Split-screen layout */}
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                    </Route>

                    {/* PROTECTED APP ROUTES - Now using LuxuryTopNavLayout */}
                    <Route path="/app" element={
                      <ProtectedRoute>
                        <LuxuryTopNavLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Navigate to="/app/dashboard" replace />} />

                      {/* Core - Phase 0 */}
                      <Route path="dashboard" element={<LuxuryDashboard />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="quick-start" element={<QuickStart />} />

                      {/* Growth Blueprint */}
                      <Route path="growth-blueprint" element={<GrowthBlueprint />} />

                      {/* Setup - Phase 1 */}
                      <Route path="setup">
                        <Route index element={<Navigate to="brand" replace />} />
                        <Route path="brand" element={<BrandSetup />} />
                        <Route path="audience" element={<TargetAudience />} />
                        <Route path="goals" element={<GoalsAndKPIs />} />
                        <Route path="competition" element={<CompetitiveAnalysisSetup />} />
                      </Route>

                      {/* Marketing Hub - Phase 2-3 */}
                      <Route path="context-marketing" element={<ContextMarketing />} />
                      <Route path="brand-memory" element={<BrandMemory />} />
                      <Route path="market-intelligence" element={<MarketIntelligence />} />
                      <Route path="content-studio" element={<ContentLibrary />} />

                      {/* Intelligence Suite - Consolidated Routes */}
                      <Route path="intelligence">
                        <Route index element={<MarketIntelligence />} />
                        <Route path="scanner" element={<Navigate to="/app/growth-blueprint" replace />} />
                        <Route path="brand" element={<BrandMemory />} />
                        <Route path="market" element={<MarketInsights />} />
                        <Route path="competitors" element={<CompetitiveAnalysisSetup />} />
                      </Route>

                      {/* Legacy Intelligence Routes - Redirect to new structure */}
                      <Route path="brand-intelligence" element={<Navigate to="/app/intelligence/brand" replace />} />
                      <Route path="market-dynamics" element={<Navigate to="/app/intelligence/market" replace />} />
                      <Route path="competitor-matrix" element={<Navigate to="/app/intelligence/competitors" replace />} />

                      {/* Creation Studio Routes (from Luxury Nav) */}
                      <Route path="ai-workshop" element={<ContentLibrary />} />
                      <Route path="campaign-architect" element={<CampaignOrchestrator />} />
                      <Route path="automation-engine" element={<JourneyBuilder />} />

                      {/* Analytics Hub Routes (from Luxury Nav) */}
                      <Route path="insights" element={<Analytics />} />

                      {/* Content Creation - Phase 3 */}
                      <Route path="content">
                        <Route path="writer" element={<AIWriter />} />
                        <Route path="images" element={<ImageGenerator />} />
                        <Route path="video" element={<CommercialCreator />} />
                      </Route>

                      {/* Campaigns - Phase 4 */}
                      <Route path="campaigns">
                        <Route index element={<CampaignOrchestrator />} />
                        <Route path="email" element={<EmailCampaignGenerator />} />
                        <Route path="social" element={<SocialPostGenerator />} />
                        <Route path="landing" element={<LandingPageGenerator />} />
                      </Route>

                      {/* Automation - Phase 5 */}
                      <Route path="automation">
                        <Route index element={<JourneyBuilder />} />
                        <Route path="workflows" element={<JourneyBuilder />} />
                        <Route path="journeys" element={<JourneyBuilder />} />
                        <Route path="agents" element={<ConversationalAI />} />
                        <Route path="triggers" element={<CampaignOrchestrator />} />
                      </Route>

                      {/* Contacts */}
                      <Route path="contacts" element={<ContactManager />} />

                      {/* Libraries */}
                      <Route path="content-library" element={<ContentLibrary />} />
                      <Route path="media-library" element={<MediaLibrary />} />
                      <Route path="brand-kits" element={<BrandKits />} />

                      {/* Additional Routes */}
                      <Route path="website-analyzer" element={<WebsiteAnalyzer />} />
                      <Route path="presentation-generator" element={<PresentationGenerator />} />
                      <Route path="ai-training" element={<AITrainingInterface />} />
                      <Route path="revenue-intelligence" element={<RevenueIntelligence />} />
                      <Route path="enterprise/governance" element={<EnterpriseGovernance />} />
                      <Route path="ecosystem" element={<EcosystemExpansion />} />
                      <Route path="tutorial-creator" element={<TutorialCreator />} />
                      <Route path="commercial-creator" element={<CommercialCreator />} />
                    </Route>

                    {/* Legacy redirects */}
                    <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="/brand-memory" element={<Navigate to="/app/brand-memory" replace />} />

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>

                <Toaster />
                <Sonner />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
