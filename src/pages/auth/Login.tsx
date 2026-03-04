// src/pages/auth/Login.tsx
// Luxury dark login page + MFA verification step

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  Github,
  Chrome,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);

  const { signIn, signInWithGoogle, signInWithGitHub, verifyMfa } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app/dashboard';
  const nl = lang === 'nl';

  // Check onboarding status and resolve destination
  const resolveDestination = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.user_metadata?.onboarding_completed) return '/app/onboarding';
    return from;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { mfaRequired } = await signIn(email, password);

      if (mfaRequired) {
        // Get the factor ID to challenge
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.find(f => f.status === 'verified');
        if (totpFactor) {
          setMfaFactorId(totpFactor.id);
          setMfaStep(true);
          setMfaCode('');
        } else {
          // No verified factor found, proceed anyway
          toast.success(nl ? 'Welkom terug!' : 'Welcome back!');
          const dest = await resolveDestination();
          navigate(dest, { replace: true });
        }
      } else {
        toast.success(nl ? 'Welkom terug!' : 'Welcome back!');
        const dest = await resolveDestination();
        navigate(dest, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || (nl ? 'Ongeldige inloggegevens' : 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (mfaCode.length !== 6) return;

    setMfaVerifying(true);
    try {
      await verifyMfa(mfaFactorId, mfaCode);
      toast.success(nl ? 'Welkom terug!' : 'Welcome back!');
      const dest = await resolveDestination();
      navigate(dest, { replace: true });
    } catch (error: any) {
      toast.error(t('login.mfa.invalid'));
      setMfaCode('');
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaStep(false);
    setMfaCode('');
    setMfaFactorId('');
    // Sign out since we're at aal1 only
    supabase.auth.signOut().catch(() => {});
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithGitHub();
      }
    } catch (error: any) {
      toast.error(nl ? `Inloggen met ${provider} mislukt` : `Login with ${provider} failed`);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {mfaStep ? (
        /* ─── MFA VERIFICATION STEP ──────────────────────── */
        <motion.div
          key="mfa"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="text-white"
        >
          {/* Logo */}
          <div className="flex items-center mb-8">
            <img src="/logo-inclufy.svg" alt="Inclufy - AI Marketing" className="h-11" />
          </div>

          {/* MFA Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              {t('login.mfa.title')}
            </h2>
            <p className="text-gray-500">
              {t('login.mfa.subtitle')}
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={mfaCode}
                onChange={setMfaCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-14 text-xl bg-white/5 border-white/10 text-white" />
                  <InputOTPSlot index={1} className="w-14 h-14 text-xl bg-white/5 border-white/10 text-white" />
                  <InputOTPSlot index={2} className="w-14 h-14 text-xl bg-white/5 border-white/10 text-white" />
                  <InputOTPSlot index={3} className="w-14 h-14 text-xl bg-white/5 border-white/10 text-white" />
                  <InputOTPSlot index={4} className="w-14 h-14 text-xl bg-white/5 border-white/10 text-white" />
                  <InputOTPSlot index={5} className="w-14 h-14 text-xl bg-white/5 border-white/10 text-white" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleMfaVerify}
              disabled={mfaVerifying || mfaCode.length !== 6}
              className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium"
            >
              {mfaVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {nl ? 'Verifiëren...' : 'Verifying...'}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {t('login.mfa.verify')}
                </>
              )}
            </Button>

            <button
              onClick={handleBackToLogin}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mx-auto transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {nl ? 'Terug naar inloggen' : 'Back to login'}
            </button>
          </div>
        </motion.div>
      ) : (
        /* ─── REGULAR LOGIN FORM ─────────────────────────── */
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-white"
        >
          {/* Logo */}
          <div className="flex items-center mb-8">
            <img src="/logo-inclufy.svg" alt="Inclufy - AI Marketing" className="h-11" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              {nl ? 'Welkom terug' : 'Welcome back'}
            </h2>
            <p className="text-gray-500">
              {nl ? 'Log in op je account om verder te gaan' : 'Sign in to your account to continue'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-400 text-sm">E-mail</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={nl ? 'jij@bedrijf.com' : 'you@company.com'}
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-purple-500/20"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-400 text-sm">
                {nl ? 'Wachtwoord' : 'Password'}
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={nl ? 'Voer je wachtwoord in' : 'Enter your password'}
                  className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-purple-500/20"
                  required
                  disabled={loading}
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer">
                  {nl ? 'Onthoud mij' : 'Remember me'}
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                {nl ? 'Wachtwoord vergeten?' : 'Forgot password?'}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {nl ? 'Inloggen...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {nl ? 'Inloggen' : 'Sign in'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0a0a0f] px-3 text-gray-600">
                {nl ? 'Of ga verder met' : 'Or continue with'}
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="h-11 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Chrome className="w-4 h-4 mr-2" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className="h-11 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            {nl ? 'Nog geen account?' : "Don't have an account?"}{' '}
            <Link
              to="/signup"
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              {nl ? 'Gratis aanmelden' : 'Sign up for free'}
            </Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
