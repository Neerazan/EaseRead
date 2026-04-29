'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AtSign,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { api, ApiError } from '@/lib/api';

const clientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-client-id';

interface PasswordStrength {
  score: number;
  checks: {
    minLength: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(form.password);

  // Redirect if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('userContext');
    if (storedUser && storedUser !== 'undefined') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      await api.signUp(form);
      // After signup, auto sign-in
      const loginRes = await api.signIn({
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('userContext', JSON.stringify(loginRes.data.user));
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const errors: Record<string, string> = {};
          err.errors.forEach((e) => {
            errors[e.field] = e.message;
          });
          setFieldErrors(errors);
        }
        setError(err.message);
      } else {
        setError('An error occurred during registration.');
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
        setError('Google sign-up failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthLabel =
    strength.score <= 1
      ? 'Weak'
      : strength.score <= 3
        ? 'Fair'
        : strength.score <= 4
          ? 'Good'
          : 'Strong';

  const strengthColor =
    strength.score <= 1
      ? 'bg-red-500'
      : strength.score <= 3
        ? 'bg-amber-500'
        : strength.score <= 4
          ? 'bg-brand-blue'
          : 'bg-emerald-500';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex">
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-blue-900 items-center justify-center p-12">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-brand-red rounded-full animate-pulse-soft" />

          <div className="relative z-10 max-w-md">
            <Logo
              size={48}
              showText={false}
              className="mb-8 [&_path]:!stroke-white [&_line]:!stroke-white"
            />
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Start reading
              <br />
              <span className="text-blue-200">smarter today</span>
            </h1>
            <p className="text-blue-200/80 text-lg leading-relaxed">
              Create your free account and unlock AI-powered document reading.
              Upload your first document in seconds.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { label: 'Free to start', icon: Check },
                { label: 'No credit card', icon: Check },
                { label: 'AI-powered Q&A', icon: Check },
                { label: 'PDF support', icon: Check },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-blue-100"
                >
                  <item.icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background overflow-y-auto">
          <div className="w-full max-w-md animate-fade-in">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <Logo size={36} />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">
              Create your account
            </h2>
            <p className="text-muted mb-8">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-brand-blue font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
                  <input
                    id="signup-name"
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="John Doe"
                    required
                    minLength={3}
                    maxLength={100}
                    className="input-field !pl-10"
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="signup-username"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
                  <input
                    id="signup-username"
                    type="text"
                    value={form.username}
                    onChange={handleChange('username')}
                    placeholder="johndoe"
                    required
                    minLength={3}
                    maxLength={20}
                    className="input-field !pl-10"
                    autoComplete="username"
                  />
                </div>
                {fieldErrors.username && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
                  <input
                    id="signup-email"
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="you@example.com"
                    required
                    className="input-field !pl-10"
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="Create a strong password"
                    required
                    className="input-field !pl-10 !pr-10"
                    autoComplete="new-password"
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

                {/* Password Strength */}
                {form.password && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(strength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted">
                        {strengthLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'minLength' as const, label: '8+ characters' },
                        { key: 'hasLower' as const, label: 'Lowercase' },
                        { key: 'hasUpper' as const, label: 'Uppercase' },
                        { key: 'hasNumber' as const, label: 'Number' },
                        { key: 'hasSymbol' as const, label: 'Symbol' },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`flex items-center gap-1.5 text-xs ${
                            strength.checks[item.key]
                              ? 'text-emerald-600'
                              : 'text-muted'
                          }`}
                        >
                          {strength.checks[item.key] ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || strength.score < 5}
                className="btn-primary w-full !py-3 !rounded-xl !mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Create Account'
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

            {/* Google */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-up failed')}
                shape="pill"
                theme="outline"
                size="large"
                text="signup_with"
                width={360}
              />
            </div>

            <p className="mt-8 text-xs text-center text-muted">
              By creating an account, you agree to EaseRead&apos;s{' '}
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
