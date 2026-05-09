'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ShieldCheck, LogOut, Loader2 } from 'lucide-react';

interface MFAVerifyProps {
  onSuccess: () => void;
  onSignOut?: () => void;
}

export function MFAVerify({ onSuccess, onSignOut }: MFAVerifyProps) {
  const supabase = createClient();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [factorId, setFactorId] = useState('');

  useEffect(() => {
    loadFactor();
  }, []);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && factorId && !loading) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const loadFactor = async () => {
    try {
      const { data, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) throw factorError;

      const totpFactor = data.totp[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load MFA factor.');
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6 || !factorId) return;

    setLoading(true);
    setError('');
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: otpCode,
      });

      if (verifyError) throw verifyError;

      onSuccess();
    } catch (err: any) {
      setError('Invalid code. Please try again.');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              disabled={loading}
              className="w-48 text-center text-3xl font-mono tracking-[0.5em] border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || otpCode.length !== 6}
            className="w-full px-4 py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
