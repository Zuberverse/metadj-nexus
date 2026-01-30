'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!token) {
      setStatus('error');
      setMessage('Reset link is missing or invalid.');
      return;
    }

    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('saving');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Password updated. You can sign in now.');
        setTimeout(() => router.push('/'), 1500);
      } else {
        setStatus('error');
        setMessage(data.message || 'Unable to reset password.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full text-white bg-[var(--bg-surface-base)] overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 gradient-1" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[200%] h-[150%] brand-gradient opacity-30 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-10">
          <div className="max-w-md mx-auto">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gradient-primary mb-3 text-center">
              Set a new password
            </h1>
            <p className="text-sm sm:text-base text-white/70 text-center mb-6">
              Create a new password for your MetaDJ Nexus account.
            </p>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
              {!token && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Reset link is missing. Request a new one below.
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-white/70 mb-2">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      required
                      minLength={8}
                      disabled={status === 'saving'}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-white/70 mb-2">
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      required
                      minLength={8}
                      disabled={status === 'saving'}
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        status === 'success'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                          : 'border-red-500/40 bg-red-500/10 text-red-300'
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="w-full min-h-[48px] py-3 brand-gradient text-white font-heading font-semibold rounded-xl transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'saving' ? 'Saving...' : 'Update password'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 text-center">
              {token ? (
                <Link href="/" className="text-sm text-purple-300 hover:text-purple-200 underline underline-offset-2">
                  Back to sign in
                </Link>
              ) : (
                <Link href="/forgot-password" className="text-sm text-purple-300 hover:text-purple-200 underline underline-offset-2">
                  Request a new reset link
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
