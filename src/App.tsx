import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Dashboard & Core pages
import Dashboard from "./pages/Dashboard";
import BrandMemory from "./pages/BrandMemory";
import WebsiteAnalyzer from "./pages/WebsiteAnalyzer";
import { PresentationGenerator } from "@/components/PresentationGenerator";

// Phase 2 - Core Monetization pages
import EmailCampaignGenerator from "./pages/EmailCampaignGenerator";
import LandingPageGenerator from "./pages/LandingPageGenerator";
import Phase2Overview from "./pages/Phase2Overview";

// Phase 3 - Autonomy & Scale pages
import JourneyBuilder from "./pages/JourneyBuilder";
import CampaignOrchestrator from "./pages/CampaignOrchestrator";
import ConversationalAI from "./pages/ConversationalAI";
import AITrainingInterface from "./pages/AITrainingInterface";

// Phase 4 - Revenue Intelligence & Enterprise pages
import RevenueIntelligence from "./pages/RevenueIntelligence";
import EnterpriseGovernance from "./pages/EnterpriseGovernance";

// Phase 5 - Ecosystem & Expansion pages
import EcosystemExpansion from "./pages/EcosystemExpansion";

// Existing Content Creation pages
import TutorialCreator from "./pages/TutorialCreator";
import CommercialCreator from "./pages/CommercialCreator";
import SocialPostGenerator from "./pages/SocialPostGenerator";

// Library & Management pages
import ContentLibrary from "./pages/ContentLibrary";
import ScheduledPosts from "./pages/ScheduledPosts";
import BrandKits from "./pages/BrandKits";
import MediaLibrary from "./pages/MediaLibrary";

// Settings pages
import AccountSettings from "./pages/AccountSettings";
import ApplicationSettings from "./pages/ApplicationSettings";
import TeamSettings from "./pages/TeamSettings";

// Error pages
import NotFound from "./pages/NotFound";

// Legacy Index page (optional - can redirect to dashboard)
import Index from "./pages/Index";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes with MainLayout */}
            <Route element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              {/* Dashboard - new home */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Phase 1 - AI Foundation */}
              <Route path="/brand-memory" element={<BrandMemory />} />
              <Route path="/website-analyzer" element={<WebsiteAnalyzer />} />
              <Route path="/presentation-generator" element={<PresentationGenerator />} />
              
              {/* Phase 2 - Core Monetization */}
              <Route path="/phase2" element={<Phase2Overview />} />
              <Route path="/email-campaigns" element={<EmailCampaignGenerator />} />
              <Route path="/landing-pages" element={<LandingPageGenerator />} />
              
              {/* Phase 3 - Autonomy & Scale */}
              <Route path="/journey-builder" element={<JourneyBuilder />} />
              <Route path="/campaign-orchestrator" element={<CampaignOrchestrator />} />
              <Route path="/conversational-ai" element={<ConversationalAI />} />
              <Route path="/ai-training" element={<AITrainingInterface />} />
              
              {/* Phase 4 - Revenue Intelligence & Enterprise */}
              <Route path="/revenue-intelligence" element={<RevenueIntelligence />} />
              <Route path="/enterprise-governance" element={<EnterpriseGovernance />} />
              
              {/* Phase 5 - Ecosystem & Expansion */}
              <Route path="/ecosystem" element={<EcosystemExpansion />} />
              
              {/* Content Creation - your existing pages */}
              <Route path="/tutorial-creator" element={<TutorialCreator />} />
              <Route path="/commercial-creator" element={<CommercialCreator />} />
              <Route path="/social-posts" element={<SocialPostGenerator />} />
              <Route path="/social-post-generator" element={<Navigate to="/social-posts" replace />} />
              
              {/* Library & Management */}
              <Route path="/content-library" element={<ContentLibrary />} />
              <Route path="/media-library" element={<MediaLibrary />} />
              <Route path="/scheduled-posts" element={<ScheduledPosts />} />
              <Route path="/brand-kits" element={<BrandKits />} />
              
              {/* Settings */}
              <Route path="/settings/account" element={<AccountSettings />} />
              <Route path="/settings/application" element={<ApplicationSettings />} />
              <Route path="/settings/team" element={<TeamSettings />} />
              
              {/* Legacy mascot page - optional */}
              <Route path="/mascot" element={<Index />} />
            </Route>
            
            {/* Auth callback */}
            <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;