'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ShieldCheck, QrCode, Copy, Check, Loader2 } from 'lucide-react';

interface MFASetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'intro' | 'qr' | 'verify' | 'done';

export function MFASetup({ open, onOpenChange, onSuccess }: MFASetupProps) {
  const supabase = createClient();
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Inclufy Marketing',
        friendlyName: 'Inclufy Marketing TOTP',
      });

      if (enrollError) throw enrollError;

      setFactorId(data.id);
      setTotpUri(data.totp.uri);
      setTotpSecret(data.totp.secret);
      // Supabase returns the QR code as an SVG string
      setQrSvg(data.totp.qr_code);
      setStep('qr');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
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

      setStep('done');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep('intro');
    setFactorId('');
    setTotpUri('');
    setTotpSecret('');
    setQrSvg('');
    setOtpCode('');
    setError('');
    setCopied(false);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">

        {/* Intro step */}
        {step === 'intro' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Set up Two-Factor Authentication</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account using an authenticator app.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-500 dark:text-gray-400">
                <li>Install an authenticator app (Google Authenticator, Authy, 1Password)</li>
                <li>Scan the QR code shown in the next step</li>
                <li>Enter the 6-digit code to confirm setup</li>
              </ol>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* QR step */}
        {step === 'qr' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Scan QR Code</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Open your authenticator app and scan the QR code below.
            </p>

            {/* QR code — Supabase returns SVG string, display as data URL */}
            <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-200">
              {qrSvg ? (
                // Supabase returns the QR code as a plain SVG string — use as img src directly
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSvg}
                  alt="TOTP QR Code"
                  width={200}
                  height={200}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Manual secret entry */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Can't scan? Enter this secret manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg text-xs font-mono break-all border border-gray-200 dark:border-gray-700">
                  {totpSecret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="shrink-0 p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  title="Copy secret"
                >
                  {copied
                    ? <Check className="h-4 w-4 text-green-500" />
                    : <Copy className="h-4 w-4 text-gray-500" />
                  }
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next — Enter Code
            </button>
          </div>
        )}

        {/* Verify step */}
        {step === 'verify' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Confirm Setup</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the 6-digit code from your authenticator app to confirm.
            </p>

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
                className="w-40 text-center text-2xl font-mono tracking-[0.4em] border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-white"
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
              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify & Enable
            </button>
            <button
              onClick={() => { setStep('qr'); setOtpCode(''); setError(''); }}
              className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Back to QR code
            </button>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-600">Two-Factor Authentication Enabled</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your account is now protected with TOTP authentication.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
