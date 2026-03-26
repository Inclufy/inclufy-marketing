'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Voer een geldig e-mailadres in.';
    }
    if (password.length < 6) {
      newErrors.password = 'Wachtwoord moet minimaal 6 tekens bevatten.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (isLogin) {
      router.push('/dashboard');
    } else {
      toast.success('Account aangemaakt! Je kunt nu inloggen.');
      setIsLogin(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">AMOS Dashboard</h1>
          <p className="text-sm text-gray-500">Autonomous Marketing Operating System</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Inloggen
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Registreren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                placeholder="naam@bedrijf.nl"
                className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500'}`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                placeholder="Minimaal 6 tekens"
                className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500'}`}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 py-3 text-sm font-semibold text-white shadow-lg hover:from-brand-700 hover:to-brand-800 disabled:opacity-50 transition-all"
          >
            {loading ? 'Even geduld...' : isLogin ? 'Inloggen' : 'Account aanmaken'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
