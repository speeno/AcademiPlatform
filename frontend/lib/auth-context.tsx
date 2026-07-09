'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader, getAccessToken, subscribeAuthState } from '@/lib/auth';

type AuthMe = {
  name?: string;
  email?: string;
  role?: string;
  trainingManager?: boolean;
};

type AuthContextValue = {
  isLoggedIn: boolean | null;
  me: AuthMe | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [me, setMe] = useState<AuthMe | null>(null);

  useEffect(() => {
    let active = true;

    const sync = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!active) return;
        setIsLoggedIn(false);
        setMe(null);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
          headers: buildAuthHeader(false),
        });
        if (!active) return;
        if (!res.ok) {
          setIsLoggedIn(false);
          setMe(null);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setIsLoggedIn(true);
        setMe({
          name: typeof data?.name === 'string' ? data.name : '',
          email: typeof data?.email === 'string' ? data.email : '',
          role: typeof data?.role === 'string' ? data.role : '',
          trainingManager: data?.permissions?.trainingManagement === true,
        });
      } catch {
        if (!active) return;
        setIsLoggedIn(false);
        setMe(null);
      }
    };

    void sync();
    const unsubscribe = subscribeAuthState(() => {
      void sync();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ isLoggedIn, me }), [isLoggedIn, me]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
