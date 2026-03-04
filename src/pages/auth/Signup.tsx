// src/pages/auth/Signup.tsx
// Luxury dark signup page

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Github,
  Chrome,
  Check,
} from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(nl ? 'Wachtwoorden komen niet overeen!' : 'Passwords do not match!');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error(nl ? 'Ga akkoord met de voorwaarden' : 'Please agree to the terms');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
        },
      });

      if (error) throw error;

      // If auto-confirmed (session exists), go straight to onboarding
      if (data.session) {
        toast.success(nl ? 'Welkom bij Inclufy!' : 'Welcome to Inclufy!');
        navigate('/app/onboarding', { replace: true });
      } else {
        toast.success(nl ? 'Account aangemaakt! Controleer je e-mail om te verifiëren.' : 'Account created! Check your email to verify.');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.message || (nl ? 'Account aanmaken mislukt' : 'Failed to create account'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-purple-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-white"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Inclufy" className="w-10 h-10 rounded-xl" />
          <span className="text-xl font-semibold tracking-tight">
            Inclufy<span className="text-purple-400">.</span>
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {nl ? 'Maak je account aan' : 'Create your account'}
        </h2>
        <p className="text-gray-500">{nl ? 'Start je 14 dagen gratis proefperiode' : 'Start your 14-day free trial'}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-gray-400 text-sm">{nl ? 'Volledige Naam' : 'Full Name'}</Label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="fullName"
              type="text"
              placeholder={nl ? 'Je volledige naam' : 'Your full name'}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-400 text-sm">E-mail</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="email"
              type="email"
              placeholder={nl ? 'jij@bedrijf.com' : 'you@company.com'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-gray-400 text-sm">{nl ? 'Wachtwoord' : 'Password'}</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={nl ? 'Maak een wachtwoord' : 'Create a password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`${inputClass} pr-10`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-gray-400 text-sm">{nl ? 'Bevestig Wachtwoord' : 'Confirm Password'}</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder={nl ? 'Bevestig je wachtwoord' : 'Confirm your password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, agreeToTerms: checked as boolean })
            }
            className="mt-0.5 border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
          />
          <label htmlFor="terms" className="text-sm text-gray-500 cursor-pointer leading-relaxed">
            {nl ? (
              <>Ik ga akkoord met de{' '}
              <span className="text-purple-400 hover:text-purple-300">Servicevoorwaarden</span>
              {' '}en het{' '}
              <span className="text-purple-400 hover:text-purple-300">Privacybeleid</span></>
            ) : (
              <>I agree to the{' '}
              <span className="text-purple-400 hover:text-purple-300">Terms of Service</span>
              {' '}and{' '}
              <span className="text-purple-400 hover:text-purple-300">Privacy Policy</span></>
            )}
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {nl ? 'Account aanmaken...' : 'Creating account...'}
            </>
          ) : (
            <>
              {nl ? 'Account Aanmaken' : 'Create Account'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Trial features */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        {(nl ? ['5.000 AI credits', 'Alle functies', 'Geen creditcard', 'Altijd opzegbaar'] : ['5,000 AI credits', 'All features', 'No credit card', 'Cancel anytime']).map((f) => (
          <span key={f} className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-500" />
            {f}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0a0a0f] px-3 text-gray-600">{nl ? 'Of registreer met' : 'Or sign up with'}</span>
        </div>
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-11 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <Chrome className="w-4 h-4 mr-2" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-11 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <Github className="w-4 h-4 mr-2" />
          GitHub
        </Button>
      </div>

      {/* Login link */}
      <p className="text-center text-sm text-gray-500 mt-8">
        {nl ? 'Heb je al een account?' : 'Already have an account?'}{' '}
        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          {nl ? 'Inloggen' : 'Sign in'}
        </Link>
      </p>
    </motion.div>
  );
}
