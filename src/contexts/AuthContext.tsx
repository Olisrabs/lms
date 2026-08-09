import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setTokens, clearTokens, type AuthUser } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ success: boolean; error?: string }>;
  signUpAdmin: (email: string, password: string, fullName: string, adminKey: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (updatedUser: AuthUser) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

let restorePromise: Promise<void> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = sessionStorage.getItem('edule_session_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.id === 'mock-id-123' || (typeof parsed.id === 'string' && parsed.id.startsWith('mock-'))) {
          sessionStorage.removeItem('edule_session_user');
          sessionStorage.removeItem('edule_refresh');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // ── On mount: attempt to restore session via refresh token ────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const refreshToken = sessionStorage.getItem('edule_refresh');
      if (!refreshToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (restorePromise) {
        try {
          await restorePromise;
        } finally {
          setIsLoading(false);
        }
        return;
      }

      restorePromise = (async () => {
        try {
          const res = await fetch(`${((import.meta as any).env?.VITE_API_URL) || 'http://localhost:4000/api/v1'}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (res.ok) {
            const { access_token, refresh_token: newRefresh } = await res.json();
            setTokens(access_token, newRefresh);

            const { user: me } = await authApi.me();
            // Flag students who haven't completed onboarding
            const meWithFlag = {
              ...me,
              onboardingIncomplete:
                me.role === 'student' && (!me.phone || !me.date_of_birth),
            };
            setUser(meWithFlag);
            sessionStorage.setItem('edule_session_user', JSON.stringify(meWithFlag));
          } else {
            clearTokens();
            sessionStorage.removeItem('edule_session_user');
            setUser(null);
          }
        } catch (err) {
          clearTokens();
          sessionStorage.removeItem('edule_session_user');
          setUser(null);
        }
      })();

      try {
        await restorePromise;
      } finally {
        setIsLoading(false);
        restorePromise = null;
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
      sessionStorage.setItem('edule_session_user', JSON.stringify(signedInUser));
      return { success: true };
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      return { success: false, error: error.error || error.message || 'Sign in failed' };
    }
  }, []);

  // ── Sign up ───────────────────────────────────────────────────────────────
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: signedUpUser, access_token, refresh_token } = await authApi.signUp({
        email,
        password,
        full_name: fullName,
        role,
      });
      setTokens(access_token, refresh_token);
      setUser(signedUpUser);
      sessionStorage.setItem('edule_session_user', JSON.stringify(signedUpUser));
      return { success: true };
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      return { success: false, error: error.error || error.message || 'Sign up failed' };
    }
  }, []);

  // ── Sign up Admin ─────────────────────────────────────────────────────────
  const signUpAdmin = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    adminKey: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: signedUpUser, access_token, refresh_token } = await authApi.signUpAdmin({
        email,
        password,
        full_name: fullName,
        admin_key: adminKey,
      });
      setTokens(access_token, refresh_token);
      setUser(signedUpUser);
      sessionStorage.setItem('edule_session_user', JSON.stringify(signedUpUser));
      return { success: true };
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      return { success: false, error: error.error || error.message || 'Admin sign up failed' };
    }
  }, []);

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } finally {
      clearTokens();
      setUser(null);
      sessionStorage.removeItem('mock_user_role');
      sessionStorage.removeItem('mock_user_email');
      sessionStorage.removeItem('mock_user_name');
      sessionStorage.removeItem('edule_session_user');
    }
  }, []);

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('edule_session_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signUpAdmin,
        signOut,
        updateUser,
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
