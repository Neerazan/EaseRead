'use client';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Require the user to set their Client ID in their environment securely!
const clientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-client-id';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('userContext');
      if (storedUser) {
        router.push('/');
      }
    }
  }, [router]);

  const handleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const responseJson = await res.json();

      if (res.ok && responseJson.success) {
        // Simple way to share user state across simple test frontend.
        // For production, consider React Context or fetching from a /me endpoint using HttpOnly cookies!
        localStorage.setItem(
          'userContext',
          JSON.stringify(responseJson.data.user),
        );
        router.push('/'); // Redirecting to home
      } else {
        setError(responseJson.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950 font-sans min-h-screen items-center justify-center p-4">
        <main className="w-full max-w-md bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-8 transition-all hover:shadow-indigo-500/10">
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              EaseRead
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Please sign in to your workspace
            </p>
          </div>

          <div className="flex flex-col items-center">
            {loading ? (
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                  Authenticating...
                </p>
              </div>
            ) : (
              <div className="w-full flex-col items-center flex transform transition-all duration-500">
                <div className="w-full p-6 pb-2 rounded-2xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center justify-center gap-6 mb-4">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => setError('Google initialization failed')}
                    useOneTap
                    shape="pill"
                    theme="outline"
                  />
                  {error && (
                    <p className="text-red-500 text-sm font-medium animate-pulse">
                      {error}
                    </p>
                  )}
                </div>

                <p className="mt-4 text-xs text-center text-zinc-400 dark:text-zinc-500 max-w-xs">
                  By continuing, you agree to EaseRead's Terms of Service and
                  Privacy Policy.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}
