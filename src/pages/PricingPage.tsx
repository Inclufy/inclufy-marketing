import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

const PLAN_COLORS: Record<string, string> = {
  starter: "from-blue-500 to-cyan-500",
  professional: "from-purple-600 to-pink-600",
  enterprise: "from-amber-500 to-orange-500",
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
      // Fallback plans if backend is unavailable
      setPlans([
        {
          id: "starter",
          name: "Starter",
          price_monthly: 29,
          price_yearly: 290,
          features: [
            "Up to 1,000 contacts",
            "5 campaigns/month",
            "Basic AI content generation",
            "Email sending (SendGrid/Resend)",
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
            "Advanced AI content + image generation",
            "Multi-channel campaigns",
            "Brand memory & compliance",
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
            "API access",
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
      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        // Not logged in – redirect to signup
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
    const savings = Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
    return savings;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/favicon.svg" alt="Inclufy Marketing" className="w-10 h-10 rounded-xl shadow-lg" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                Inclufy Marketing
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center">
        <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          Simple, transparent pricing
        </Badge>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 text-transparent bg-clip-text">
          Choose your plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          Start free, upgrade when you're ready. All plans include a 14-day free trial.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === "monthly"
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Yearly
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
              Save up to 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = PLAN_ICONS[plan.id] || Zap;
            const gradient = PLAN_COLORS[plan.id] || "from-gray-500 to-gray-600";
            const isPopular = plan.id === "professional";
            const price =
              billingCycle === "monthly"
                ? plan.price_monthly
                : Math.round(plan.price_yearly / 12);
            const discount = yearlyDiscount(plan.price_monthly, plan.price_yearly);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all hover:shadow-xl ${
                  isPopular
                    ? "border-purple-500 shadow-lg shadow-purple-500/10 scale-[1.02]"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-gray-500">/month</span>
                </div>

                {billingCycle === "yearly" && discount > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    Save {discount}% with yearly billing (${plan.price_yearly}/year)
                  </p>
                )}
                {billingCycle === "monthly" && (
                  <p className="text-sm text-gray-500 mb-4">
                    Billed monthly
                  </p>
                )}

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full mb-6 ${
                    isPopular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : ""
                  }`}
                  variant={isPopular ? "default" : "outline"}
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
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ / CTA */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            All plans include a 14-day free trial. No credit card required to start.
            Cancel anytime from your account settings.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
