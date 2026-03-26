'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, ShieldOff, Loader2 } from 'lucide-react';
import { MFASetup } from './MFASetup';

export function MFAStatus() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setLoading(true);
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const verifiedFactor = data.totp[0];
      if (verifiedFactor) {
        setMfaEnabled(true);
        setFactorId(verifiedFactor.id);
      } else {
        setMfaEnabled(false);
        setFactorId('');
      }
    } catch (err: any) {
      console.error('MFA status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!factorId) return;
    setDisabling(true);
    setError('');
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
      if (unenrollError) throw unenrollError;

      setMfaEnabled(false);
      setFactorId('');
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disable MFA.');
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Loading security settings…</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="flex items-center gap-3">
          {mfaEnabled ? (
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Two-Factor Authentication
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mfaEnabled ? 'Active — your account is protected' : 'Not enabled — recommended for security'}
            </p>
          </div>
        </div>

        {mfaEnabled ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5 transition-colors"
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Disable
          </button>
        ) : (
          <button
            onClick={() => setShowSetup(true)}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Enable
          </button>
        )}
      </div>

      {/* Disable confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <ShieldOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Disable Two-Factor Auth?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  This will remove MFA from your account and reduce its security.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowConfirm(false); setError(''); }}
                disabled={disabling}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable}
                disabled={disabling}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {disabling && <Loader2 className="h-4 w-4 animate-spin" />}
                Disable MFA
              </button>
            </div>
          </div>
        </div>
      )}

      <MFASetup
        open={showSetup}
        onOpenChange={setShowSetup}
        onSuccess={() => {
          setShowSetup(false);
          checkMFAStatus();
        }}
      />
    </>
  );
}
