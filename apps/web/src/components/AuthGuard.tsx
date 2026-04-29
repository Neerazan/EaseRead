'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserData } from '@/lib/api';

interface AuthGuardProps {
  children: (user: UserData) => React.ReactNode;
}

/**
 * Client-side auth guard. Checks localStorage for user context.
 * Redirects to /login if not authenticated.
 * Passes the user object to children via render prop.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('userContext');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('userContext');
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-brand-blue-100 border-t-brand-blue rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children(user)}</>;
}
