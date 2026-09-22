import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function StaffSignInPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'instructor'>('instructor');
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

    const { success, error: apiError } = await signIn(email, password, role);
    setLoading(false);

    if (!success) {
      setError(apiError || 'Sign in failed. Please try again.');
      return;
    }

    // Navigate to intended destination or default dashboard
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
    } else {
      navigate(role === 'admin' ? '/admin' : '/instructor', { replace: true });
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden dashboard-pattern-bg">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-3 transition-transform hover:scale-105">
            <img 
              src="/logo.PNG" 
              alt="Make It Simple" 
              className="h-11 w-auto mx-auto" 
              style={{ maxHeight: '48px', width: 'auto', margin: '0 auto' }} 
            />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Staff Portal</h1>
          <p className="text-muted-foreground mt-1">Sign in to access your dashboard</p>
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
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'instructor')}
                className={inputClass}
              >
                <option value="instructor">Instructor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="staff@academy.edu"
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
              <Link to="/staff/signup" className="text-primary font-semibold hover:underline">
                Apply as Instructor
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
