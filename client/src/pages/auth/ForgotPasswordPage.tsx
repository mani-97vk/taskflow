import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Workflow, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { authApi } from '../../api/index.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      const res = await authApi.forgotPassword({ email });
      setIsSubmitted(true);
      if (res.data?.devResetToken) {
        setDevToken(res.data.devResetToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-300 dark:shadow-none">
            <Workflow className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              If an account with that email exists, reset instructions have been generated.
            </p>

            {devToken && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                  <span>Development Mode Reset Token:</span>
                </div>
                <p className="text-[11px] font-mono break-all text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded">
                  {devToken}
                </p>
                <Link
                  to={`/auth/reset-password?token=${devToken}`}
                  className="block text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  Proceed to Reset Password Page →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Account Email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Button type="submit" size="md" className="w-full mt-2" isLoading={isLoading}>
              Send Reset Instructions
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
