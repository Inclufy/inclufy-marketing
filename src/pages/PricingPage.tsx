// src/pages/PricingPage.tsx
// Luxury dark pricing page

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
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
        title: "Checkout cancelled",
        description: "You can try again whenever you're ready.",
      });
    }
  }, [searchParams]);

  async function fetchPlans() {
    try {
      const response = await api.get("/payments/plans");
      setPlans(response.data.plans || []);
    } catch {
      setPlans([
        {
          id: "starter",
          name: "Starter",
          price_monthly: 29,
          price_yearly: 290,
          features: [
            "Up to 1,000 contacts",
            "5 campaigns per month",
            "AI content generation",
            "Email campaigns (SendGrid/Resend)",
            "Analytics dashboard",
          ],
        },
        {
          id: "professional",
          name: "Professional",
          price_monthly: 79,
          price_yearly: 790,
          features: [
            "Up to 10,000 contacts",
            "Unlimited campaigns",
            "Advanced AI content + images",
            "Multi-channel campaigns",
            "Brand Memory AI",
            "CSV import/export",
            "Priority support",
          ],
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price_monthly: 199,
          price_yearly: 1990,
          features: [
            "Unlimited contacts",
            "Unlimited campaigns",
            "Custom AI model training",
            "White-label options",
            "Dedicated account manager",
            "SSO & advanced security",
            "Full API access",
            "Custom integrations",
          ],
        },
      ]);
    }
  }

  async function handleSubscribe(planId: string) {
    setLoadingPlan(planId);
    try {
      const response = await api.post("/payments/create-checkout", {
        plan: planId,
        billing_cycle: billingCycle,
      });
      window.location.href = response.data.checkout_url;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        navigate("/signup?redirect=pricing");
        return;
      }
      toast({
        title: "Error",
        description:
          err?.response?.data?.detail ||
          "Failed to start checkout. Please try again.",
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
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Inclufy" className="w-9 h-9 rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">
              Inclufy<span className="text-purple-400">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-5">
                Get Started
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
              Simple, transparent pricing
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Choose Your{" "}
            <span className="bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300 text-transparent bg-clip-text">
              Plan
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg text-gray-400 max-w-xl mx-auto mb-10"
          >
            Start free, upgrade when you're ready. All plans include a 14-day trial.
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
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Yearly
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  Save 17%
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
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl ${accent.glow} flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5 text-white/70" />
                </div>

                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>

                {billingCycle === "yearly" && discount > 0 ? (
                  <p className="text-xs text-emerald-400 mb-6">
                    Save {discount}% &middot; ${plan.price_yearly}/year
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 mb-6">Billed monthly</p>
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
                  {loadingPlan === plan.id ? "Redirecting..." : "Start Free Trial"}
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
          <h2 className="text-3xl font-bold mb-3">Questions?</h2>
          <p className="text-gray-400 mb-8">
            All plans include a 14-day free trial. No credit card required.
            Cancel anytime from your account settings.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-8 h-12">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-white/20 text-gray-300 hover:bg-white/5 hover:text-white">
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">SOC 2 Compliant &middot; GDPR Ready &middot; Stripe Secure Payments</span>
          </div>
        </div>
      </section>
    </div>
  );
}
