import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';
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
          right: '-10%',
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
          left: '-10%',
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
            Create Account
          </h1>
          <p style={{ color: '#6B7280', fontSize: '15px' }}>
            Join Make It Simple and start your learning journey.
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
          {checkingCohort ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '12px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: '#0047D6' }} />
              <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500, margin: 0 }}>Checking cohort status...</p>
            </div>
          ) : registrationClosed ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#EBF2FF', color: '#0047D6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Clock size={32} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px' }}>Registration Closed</h2>
              <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                We are not accepting new student registrations at this time. Please check back later when registration opens for the next cohort.
              </p>
              <div style={{ padding: '16px', backgroundColor: '#F9F9FB', borderRadius: '14px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6B7280' }}>
                Already have an account?{' '}
                <Link to="/signin" style={{ color: '#0047D6', fontWeight: 700, textDecoration: 'none' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    First Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Olajide" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Last Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Abimbola" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="israel@makeitsimple.edu" 
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Create a strong password" 
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
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          )}

          {!checkingCohort && !registrationClosed && (
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Already have an account?{' '}
                <Link to="/signin" style={{ color: '#0047D6', fontWeight: 700, textDecoration: 'none' }}>
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
