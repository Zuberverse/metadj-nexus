'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatus('sent');
        setMessage(data.message || 'Check your email for a reset link.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Unable to send reset email.');
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
              Reset your password
            </h1>
            <p className="text-sm sm:text-base text-white/70 text-center mb-6">
              Enter your email and we'll send a reset link if an account exists.
            </p>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required
                    disabled={status === 'sending'}
                  />
                </div>

                {message && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      status === 'sent'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/40 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full min-h-[48px] py-3 brand-gradient text-white font-heading font-semibold rounded-xl transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-purple-300 hover:text-purple-200 underline underline-offset-2">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
