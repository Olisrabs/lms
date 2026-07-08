import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setTokens, clearTokens, type AuthUser } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── On mount: attempt to restore session via refresh token ────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const refreshToken = sessionStorage.getItem('edule_refresh');
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (res.ok) {
          const { access_token, refresh_token: newRefresh } = await res.json();
          setTokens(access_token, newRefresh);

          const { user: me } = await authApi.me();
          setUser(me);
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Sign in ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async (
    email: string,
    password: string,
    role: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: signedInUser, access_token, refresh_token } = await authApi.signIn(
        email,
        password,
        role
      );
      setTokens(access_token, refresh_token);
      setUser(signedInUser);
      return { success: true };
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      return { success: false, error: error.error || error.message || 'Sign in failed' };
    }
  }, []);

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export type { AuthUser };
