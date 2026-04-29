'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { api, ApiError } from '@/lib/api';

const clientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-client-id';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('userContext');
    if (storedUser && storedUser !== 'undefined') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.signIn({ email, password });
      localStorage.setItem('userContext', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.googleLogin(credentialResponse.credential);
      localStorage.setItem('userContext', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex">
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-blue-900 items-center justify-center p-12">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-brand-red rounded-full animate-pulse-soft" />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-brand-red rounded-full animate-pulse-soft stagger-2" />

          <div className="relative z-10 max-w-md">
            <Logo
              size={48}
              showText={false}
              className="mb-8 [&_path]:!stroke-white [&_line]:!stroke-white"
            />
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Welcome back to
              <br />
              <span className="text-blue-200">EaseRead</span>
            </h1>
            <p className="text-blue-200/80 text-lg leading-relaxed">
              Sign in to access your document library and continue reading with
              AI-powered insights.
            </p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
          <div className="w-full max-w-md animate-fade-in">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <Logo size={36} />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">
              Sign in to your account
            </h2>
            <p className="text-muted mb-8">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-brand-blue font-medium hover:underline"
              >
                Create one
              </Link>
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="input-field !pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="input-field !pl-10 !pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3 !rounded-xl !mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium text-muted uppercase">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
                shape="pill"
                theme="outline"
                size="large"
                width={360}
              />
            </div>

            <p className="mt-8 text-xs text-center text-muted">
              By signing in, you agree to EaseRead&apos;s{' '}
              <Link href="#" className="text-brand-blue hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-brand-blue hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
