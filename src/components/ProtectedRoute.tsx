import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'instructor' | 'student'>;
  redirectTo?: string;
}

/**
 * Client-side route guard.
 *
 * This is the FIRST line of defence — it prevents unauthorized users from
 * viewing pages. The SECOND line is server-side middleware (auth.middleware.ts)
 * which validates the JWT on every API request.
 *
 * A determined attacker who bypasses this React guard will still receive
 * 401/403 from all API calls.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/staff',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show a full-screen loader while the session is being restored
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your session…</p>
        </div>
      </div>
    );
  }

  // Not authenticated → send to sign-in, preserving the intended destination
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Wrong role → send to their correct dashboard
  if (!allowedRoles.includes(user.role)) {
    const dashboardMap: Record<string, string> = {
      admin: '/admin',
      instructor: '/instructor',
      student: '/student',
    };
    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  // Account not active → block access with a clear message
  if (user.status !== 'active') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card max-w-md p-8 rounded-3xl text-center space-y-4">
          <div className="text-4xl">⏳</div>
          <h2 className="text-2xl font-bold">Account Pending</h2>
          <p className="text-muted-foreground">
            Your account is currently <strong>{user.status}</strong>. Please wait for an
            administrator to approve your access, or contact support.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
