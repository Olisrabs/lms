import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { programsApi } from '../lib/api';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [checkingCohort, setCheckingCohort] = useState(true);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkCohortStatus = async () => {
      try {
        const result = await programsApi.getActiveCohort();
        if (!result.activeCohort || !result.registrationOpen) {
          setRegistrationClosed(true);
        }
      } catch (err) {
        console.error('Failed to check active cohort during signup:', err);
        // On network error or dev mock fallback, don't hard block
      } finally {
        setCheckingCohort(false);
      }
    };
    checkCohortStatus();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Strict frontend email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    // 2. Password length check
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // 3. Active cohort registration guard
    if (registrationClosed) {
      setError('Registration is closed. No new accounts can be created at this time.');
      return;
    }

    setLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();
    const { success, error: apiError } = await signUp(email, password, fullName, 'student');
    setLoading(false);

    if (!success) {
      setError(apiError || 'Sign up failed. Please try again.');
      return;
    }

    navigate('/onboarding');
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex bg-primary text-primary-foreground p-3 rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join Make It Simple and start your learning journey.</p>
        </div>
        
        <div className="glass-card p-8 rounded-3xl">
          {checkingCohort ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-muted-foreground text-sm font-medium">Checking cohort status...</p>
            </div>
          ) : registrationClosed ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Registration Closed</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                We are not accepting new student registrations at this time. Please check back later when registration opens for the next cohort.
              </p>
              <div className="p-4 bg-secondary/50 rounded-xl border border-border text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">First Name</label>
                  <input 
                    type="text" 
                    placeholder="John" 
                    className={inputClass} 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe" 
                    className={inputClass} 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john.doe@academy.edu" 
                  className={inputClass} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Create a strong password" 
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
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          )}

          {!checkingCohort && !registrationClosed && (
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
