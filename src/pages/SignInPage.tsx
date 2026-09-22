import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    // Ensure light background matches frontend design
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (hadDark) {
      root.classList.remove('dark');
    }
    return () => {
      if (hadDark) {
        root.classList.add('dark');
      }
    };
  }, []);

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

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden"
      style={{
        backgroundColor: '#F4F5F8',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Tiny, ultra-faded background stripe grid */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/assets/images/Grid-10.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: '28px 28px',
          opacity: 0.07,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Background soft ambient glows */}
      <div 
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 71, 214, 0.06) 0%, rgba(0, 71, 214, 0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 71, 214, 0.05) 0%, rgba(0, 71, 214, 0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md relative"
        style={{ zIndex: 10 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-3 transition-transform hover:scale-105">
            <img 
              height="45" 
              src="/logo.PNG" 
              alt="Make It Simple Logo" 
              style={{ maxHeight: '48px', width: 'auto', margin: '0 auto' }} 
            />
          </Link>
          <h1 
            style={{ 
              fontFamily: "'Lexend Deca', sans-serif", 
              fontSize: '30px', 
              fontWeight: 800, 
              color: '#1A1A2E',
              marginBottom: '6px'
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: '#6B7280', fontSize: '15px' }}>
            Sign in to your Make It Simple account
          </p>
        </div>
        
        <div 
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB'
          }}
        >
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '14px'
                }}
              >
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '6px' 
                }}
              >
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="student@makeitsimple.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#1A1A2E',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0047D6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 214, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Password</label>
                <Link to="#" style={{ fontSize: '12px', color: '#0047D6', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: '12px',
                    padding: '12px 42px 12px 16px',
                    fontSize: '14px',
                    color: '#1A1A2E',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0047D6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 214, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ paddingTop: '8px' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#0047D6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: "'Lexend Deca', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px rgba(0, 71, 214, 0.25)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#003BB3';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 71, 214, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#0047D6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 71, 214, 0.25)';
                  }
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#0047D6', fontWeight: 700, textDecoration: 'none' }}>
                Request Access
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
