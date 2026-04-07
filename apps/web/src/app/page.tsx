'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('userContext');
      if (storedUser && storedUser !== 'undefined') {
        try {
          setUser(JSON.parse(storedUser));
          setLoading(false);
        } catch (error) {
          localStorage.removeItem('userContext');
          router.push('/login');
        }
      } else {
        localStorage.removeItem('userContext');
        // If not logged in, redirect to the new /login route!
        router.push('/login');
      }
    }
  }, [router]);

  const handleLogout = async () => {
    // You could also call the backend /auth/sign-out endpoint here to clear cookies
    localStorage.removeItem('userContext');
    router.push('/login');
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-zinc-950">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="flex bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950 font-sans min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-md bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-8 transition-all hover:shadow-indigo-500/10">
        <div className="flex flex-col items-center transform transition-all duration-500">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full mb-5 shadow-lg border-4 border-white dark:border-zinc-800"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mb-5 shadow-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            Welcome back, {user?.name}!
          </h2>
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium mb-2 mt-2">
            @{user?.username}
          </span>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
            {user?.email}
          </p>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
