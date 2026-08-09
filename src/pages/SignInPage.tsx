import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inferredRole = email.includes('admin')
      ? 'admin'
      : email.includes('instructor')
        ? 'instructor'
        : 'student';

    const { success, error: apiError } = await signIn(email, password, inferredRole);

    if (!success) {
      setLoading(false);
      setError(apiError || 'Sign in failed. Please try again.');
      return;
    }

    // For students: check if onboarding is incomplete (phone/dob not filled)
    if (inferredRole === 'student') {
      try {
        const { user: fullProfile } = await authApi.me();
        const needsOnboarding = !fullProfile.phone || !fullProfile.date_of_birth;
        if (needsOnboarding) {
          setLoading(false);
          navigate('/onboarding', { replace: true });
          return;
        }
      } catch {
        // If profile fetch fails, fall through to normal dashboard redirect
      }
    }

    setLoading(false);

    // Navigate to intended destination or default dashboard
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    if (from && from !== '/onboarding') {
      navigate(from, { replace: true });
    } else {
      const dashboardMap: Record<string, string> = {
        admin: '/admin',
        instructor: '/instructor',
        student: '/student',
      };
      navigate(dashboardMap[inferredRole] || '/student', { replace: true });
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex bg-primary text-primary-foreground p-3 rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        
        <div className="glass-card p-8 rounded-3xl">
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 text-sm"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
              <input 
                type="email" 
                placeholder="student@academy.edu" 
                className={inputClass} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-muted-foreground">Password</label>
                <Link to="#" className="text-xs text-primary font-semibold hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  className={inputClass} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Request Access
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
