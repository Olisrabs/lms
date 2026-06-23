import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, BookOpen, Target, CheckCircle2, 
  ArrowRight, Loader2, UploadCloud 
} from 'lucide-react';
import clsx from 'clsx';

export default function StudentOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    phone: '',
    dob: '',
    gender: '',
    educationLevel: '',
    currentOccupation: '',
    interests: [] as string[],
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/student'); // Navigate to student dashboard
    }, 1500);
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const inputClass = "w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Background', icon: BookOpen },
    { id: 3, title: 'Goals', icon: Target },
    { id: 4, title: 'Complete', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 border-b border-border bg-background/50 backdrop-blur-md z-10 flex justify-center lg:justify-start">
        <div className="flex items-center gap-2">
          <BookOpen size={28} className="text-primary" />
          <span className="text-2xl font-extrabold tracking-tight text-foreground">EduLe</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-4 z-10">
        
        {/* Progress Stepper */}
        <div className="w-full max-w-2xl mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary -z-10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: `${((step - 1) / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {steps.map((s) => {
              const isActive = step >= s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-2">
                  <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isActive ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20 scale-110"
                  )}>
                    <s.icon size={18} />
                  </div>
                  <span className={clsx(
                    "text-xs font-bold transition-colors hidden sm:block",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Let's set up your profile</h2>
                  <p className="text-muted-foreground">Tell us a bit about yourself so we can personalize your learning experience.</p>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors overflow-hidden">
                      <UploadCloud size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">Upload Photo</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                    <input 
                      type="tel" placeholder="+1 (555) 000-0000" 
                      className={inputClass}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
                      <input 
                        type="date" 
                        className={inputClass}
                        value={formData.dob}
                        onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Gender</label>
                      <select 
                        className={inputClass}
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Background */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your Background</h2>
                  <p className="text-muted-foreground">What is your current educational and professional status?</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Highest Education Level</label>
                    <select 
                      className={inputClass}
                      value={formData.educationLevel}
                      onChange={(e) => setFormData({...formData, educationLevel: e.target.value})}
                    >
                      <option value="">Select education level...</option>
                      <option value="high_school">High School Diploma</option>
                      <option value="bachelors">Bachelor's Degree</option>
                      <option value="masters">Master's Degree</option>
                      <option value="phd">Ph.D. or Higher</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Current Occupation</label>
                    <select 
                      className={inputClass}
                      value={formData.currentOccupation}
                      onChange={(e) => setFormData({...formData, currentOccupation: e.target.value})}
                    >
                      <option value="">Select current status...</option>
                      <option value="student">Full-time Student</option>
                      <option value="employed_tech">Employed in Tech</option>
                      <option value="employed_non_tech">Employed in non-Tech</option>
                      <option value="looking">Looking for opportunities</option>
                      <option value="freelance">Freelancer</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Goals */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">What do you want to learn?</h2>
                  <p className="text-muted-foreground">Select the tracks or skills you are most interested in pursuing.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['Frontend Dev', 'Backend Dev', 'UI/UX Design', 'Data Science', 'Mobile App Dev', 'Cyber Security', 'DevOps', 'Product Mgmt'].map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={clsx(
                        "p-3 rounded-xl border text-sm font-bold transition-all text-left",
                        formData.interests.includes(interest)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        {interest}
                        {formData.interests.includes(interest) && <CheckCircle2 size={16} />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Complete */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 text-center py-8"
              >
                <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold mb-2">You're all set!</h2>
                <p className="text-muted-foreground">Your profile has been created successfully. Welcome to the EduLe community.</p>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-border">
            {step > 1 && step < 4 ? (
              <button 
                onClick={handlePrev}
                className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Back
              </button>
            ) : <div></div>}

            {step < 4 ? (
              <button 
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 ml-auto"
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Go to Dashboard'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
