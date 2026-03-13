// src/pages/PricingPage.tsx
// Luxury dark pricing page

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight,
  Check,
  Zap,
  Crown,
  Building2,
  Loader2,
  Sparkles,
  Shield,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

const PLAN_ICONS: Record<string, typeof Zap> = {
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
};

const PLAN_ACCENTS: Record<string, { border: string; glow: string; badge: string }> = {
  starter: {
    border: "border-sky-500/30",
    glow: "bg-sky-500/10",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  professional: {
    border: "border-purple-500/50",
    glow: "bg-purple-500/15",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  enterprise: {
    border: "border-amber-500/30",
    glow: "bg-amber-500/10",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function PricingPage() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      toast({
        title: nl ? "Afrekenen geannuleerd" : fr ? "Paiement annule" : "Checkout cancelled",
        description: nl ? "Je kunt het opnieuw proberen wanneer je klaar bent." : fr ? "Vous pouvez reessayer quand vous le souhaitez." : "You can try again whenever you're ready.",
      });
    }
  }, [searchParams]);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase.functions.invoke('payments-plans');
      if (error) throw error;
      setPlans(data?.plans || []);
    } catch {
      setPlans([
        {
          id: "starter",
          name: nl ? "Starter" : fr ? "Debutant" : "Starter",
          price_monthly: 29,
          price_yearly: 290,
          features: [
            nl ? "Tot 1.000 contacten" : fr ? "Jusqu'a 1 000 contacts" : "Up to 1,000 contacts",
            nl ? "5 campagnes per maand" : fr ? "5 campagnes par mois" : "5 campaigns per month",
            nl ? "AI-contentgeneratie" : fr ? "Generation de contenu IA" : "AI content generation",
            nl ? "E-mailcampagnes (SendGrid/Resend)" : fr ? "Campagnes e-mail (SendGrid/Resend)" : "Email campaigns (SendGrid/Resend)",
            nl ? "Analytics dashboard" : fr ? "Tableau de bord analytique" : "Analytics dashboard",
          ],
        },
        {
          id: "professional",
          name: nl ? "Professioneel" : fr ? "Professionnel" : "Professional",
          price_monthly: 79,
          price_yearly: 790,
          features: [
            nl ? "Tot 10.000 contacten" : fr ? "Jusqu'a 10 000 contacts" : "Up to 10,000 contacts",
            nl ? "Onbeperkte campagnes" : fr ? "Campagnes illimitees" : "Unlimited campaigns",
            nl ? "Geavanceerde AI-content + afbeeldingen" : fr ? "Contenu IA avance + images" : "Advanced AI content + images",
            nl ? "Multi-channel campagnes" : fr ? "Campagnes multi-canal" : "Multi-channel campaigns",
            nl ? "Merkgeheugen AI" : fr ? "Memoire de Marque IA" : "Brand Memory AI",
            nl ? "CSV import/export" : fr ? "Import/export CSV" : "CSV import/export",
            nl ? "Prioritaire ondersteuning" : fr ? "Support prioritaire" : "Priority support",
          ],
        },
        {
          id: "enterprise",
          name: nl ? "Enterprise" : fr ? "Entreprise" : "Enterprise",
          price_monthly: 199,
          price_yearly: 1990,
          features: [
            nl ? "Onbeperkte contacten" : fr ? "Contacts illimites" : "Unlimited contacts",
            nl ? "Onbeperkte campagnes" : fr ? "Campagnes illimitees" : "Unlimited campaigns",
            nl ? "Aangepaste AI-modeltraining" : fr ? "Entrainement de modele IA personnalise" : "Custom AI model training",
            nl ? "White-label opties" : fr ? "Options marque blanche" : "White-label options",
            nl ? "Dedicated accountmanager" : fr ? "Gestionnaire de compte dedie" : "Dedicated account manager",
            nl ? "SSO & geavanceerde beveiliging" : fr ? "SSO & securite avancee" : "SSO & advanced security",
            nl ? "Volledige API-toegang" : fr ? "Acces API complet" : "Full API access",
            nl ? "Aangepaste integraties" : fr ? "Integrations personnalisees" : "Custom integrations",
          ],
        },
      ]);
    }
  }

  async function handleSubscribe(planId: string) {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planId, billing_cycle: billingCycle },
      });
      if (error) throw error;
      window.location.href = data.checkout_url;
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 401) {
        navigate("/signup?redirect=pricing");
        return;
      }
      toast({
        title: nl ? "Fout" : fr ? "Erreur" : "Error",
        description:
          err?.response?.data?.detail ||
          (nl ? "Afrekenen starten mislukt. Probeer het opnieuw." : fr ? "Echec du demarrage du paiement. Veuillez reessayer." : "Failed to start checkout. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  }

  const yearlyDiscount = (monthly: number, yearly: number) => {
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo-inclufy.svg" alt="Inclufy - AI Marketing" className="h-10" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                {nl ? 'Inloggen' : fr ? 'Se connecter' : 'Sign In'}
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-5">
                {nl ? 'Aan de slag' : fr ? 'Commencer' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HEADER ═══ */}
      <div className="relative pt-32 pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-600/15 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {nl ? 'Eenvoudige, transparante prijzen' : fr ? 'Tarification simple et transparente' : 'Simple, transparent pricing'}
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
          >
            {nl ? 'Kies je' : fr ? 'Choisissez votre' : 'Choose Your'}{" "}
            <span className="bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300 text-transparent bg-clip-text">
              {nl ? 'Abonnement' : fr ? 'Forfait' : 'Plan'}
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg text-gray-400 max-w-xl mx-auto mb-10"
          >
            {nl ? 'Start gratis, upgrade wanneer je klaar bent. Alle abonnementen bevatten een proefperiode van 14 dagen.' : fr ? "Commencez gratuitement, mettez a niveau quand vous etes pret. Tous les forfaits incluent un essai de 14 jours." : "Start free, upgrade when you're ready. All plans include a 14-day trial."}
          </motion.p>

          {/* Billing toggle */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {nl ? 'Maandelijks' : fr ? 'Mensuel' : 'Monthly'}
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {nl ? 'Jaarlijks' : fr ? 'Annuel' : 'Yearly'}
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  {nl ? 'Bespaar 17%' : fr ? 'Economisez 17%' : 'Save 17%'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ PLANS ═══ */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const Icon = PLAN_ICONS[plan.id] || Zap;
            const accent = PLAN_ACCENTS[plan.id] || PLAN_ACCENTS.starter;
            const isPopular = plan.id === "professional";
            const price =
              billingCycle === "monthly"
                ? plan.price_monthly
                : Math.round(plan.price_yearly / 12);
            const discount = yearlyDiscount(plan.price_monthly, plan.price_yearly);

            return (
              <motion.div
                key={plan.id}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={idx + 4}
                className={`relative rounded-2xl border p-8 transition-all hover:-translate-y-1 ${
                  isPopular
                    ? `${accent.border} bg-white/[0.03]`
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-rose-500 text-white border-0 px-4 py-1 text-xs">
                      {nl ? 'Meest populair' : fr ? 'Le plus populaire' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl ${accent.glow} flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5 text-white/70" />
                </div>

                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-gray-500 text-sm">{nl ? '/mnd' : fr ? '/mois' : '/mo'}</span>
                </div>

                {billingCycle === "yearly" && discount > 0 ? (
                  <p className="text-xs text-emerald-400 mb-6">
                    {nl ? `Bespaar ${discount}%` : fr ? `Economisez ${discount}%` : `Save ${discount}%`} &middot; ${plan.price_yearly}/{nl ? 'jaar' : fr ? 'an' : 'year'}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 mb-6">{nl ? 'Maandelijks gefactureerd' : fr ? 'Facturation mensuelle' : 'Billed monthly'}</p>
                )}

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full mb-6 rounded-lg h-11 ${
                    isPopular
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {loadingPlan === plan.id ? (nl ? "Doorsturen..." : fr ? "Redirection..." : "Redirecting...") : (nl ? "Start gratis proefperiode" : fr ? "Commencer l'essai gratuit" : "Start Free Trial")}
                  {loadingPlan !== plan.id && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-3">{nl ? 'Vragen?' : fr ? 'Questions ?' : 'Questions?'}</h2>
          <p className="text-gray-400 mb-8">
            {nl ? 'Alle abonnementen bevatten een gratis proefperiode van 14 dagen. Geen creditcard vereist. Annuleer op elk moment via je accountinstellingen.' : fr ? "Tous les forfaits incluent un essai gratuit de 14 jours. Aucune carte de credit requise. Annulez a tout moment depuis les parametres de votre compte." : 'All plans include a 14-day free trial. No credit card required. Cancel anytime from your account settings.'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-8 h-12">
                {nl ? 'Start gratis proefperiode' : fr ? "Commencer l'essai gratuit" : 'Start Free Trial'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-white/20 text-gray-300 hover:bg-white/5 hover:text-white">
                {nl ? 'Terug naar Home' : fr ? "Retour a l'accueil" : 'Back to Home'}
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">{nl ? 'SOC 2 Conform · AVG-klaar · Veilige Stripe-betalingen' : fr ? 'Conforme SOC 2 · Pret pour le RGPD · Paiements securises Stripe' : 'SOC 2 Compliant · GDPR Ready · Stripe Secure Payments'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
