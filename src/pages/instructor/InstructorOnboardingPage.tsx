import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, BookOpen, FileText, CheckCircle2, 
  ArrowRight, Loader2
} from 'lucide-react';
import clsx from 'clsx';

export default function InstructorOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    specialization: '',
    skills: [] as string[],
    className: '',
    relatedInfo: '',
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/instructor'); // Navigate to instructor dashboard
    }, 1500);
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const inputClass = "w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const textareaClass = "w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none min-h-[100px]";

  const steps = [
    { id: 1, title: 'Expertise', icon: Briefcase },
    { id: 2, title: 'Teaching', icon: BookOpen },
    { id: 3, title: 'Complete', icon: CheckCircle2 },
  ];

  const predefinedSkills = ['React', 'Node.js', 'Python', 'Data Analysis', 'UI/UX Design', 'Project Management', 'Cyber Security', 'DevOps'];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 border-b border-border bg-background/50 backdrop-blur-md z-10 flex justify-center lg:justify-start">
        <div className="flex items-center gap-2">
          <BookOpen size={28} className="text-primary" />
          <span className="text-2xl font-extrabold tracking-tight text-foreground">EduLe Staff</span>
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
                animate={{ width: `${((step - 1) / 2) * 100}%` }}
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
            
            {/* STEP 1: Expertise */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Area of Expertise</h2>
                  <p className="text-muted-foreground">Tell us about your professional background and skills.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Area of Specialization</label>
                    <input 
                      type="text" placeholder="e.g. Software Engineering" 
                      className={inputClass}
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Skills</label>
                    <div className="grid grid-cols-2 gap-3">
                      {predefinedSkills.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={clsx(
                            "p-3 rounded-xl border text-sm font-bold transition-all text-left",
                            formData.skills.includes(skill)
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            {skill}
                            {formData.skills.includes(skill) && <CheckCircle2 size={16} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Teaching */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Teaching Assignment</h2>
                  <p className="text-muted-foreground">What classes will you be taking?</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Class to Teach</label>
                    <input 
                      type="text" placeholder="e.g. Frontend Development Cohort 4" 
                      className={inputClass}
                      value={formData.className}
                      onChange={(e) => setFormData({...formData, className: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Related Information</label>
                    <textarea 
                      placeholder="Any other details, availability, or teaching preferences..." 
                      className={textareaClass}
                      value={formData.relatedInfo}
                      onChange={(e) => setFormData({...formData, relatedInfo: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Complete */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 text-center py-8"
              >
                <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold mb-2">You're all set!</h2>
                <p className="text-muted-foreground">Your instructor profile has been setup. Welcome to the EduLe teaching community.</p>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-border">
            {step > 1 && step < 3 ? (
              <button 
                onClick={handlePrev}
                className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Back
              </button>
            ) : <div></div>}

            {step < 3 ? (
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
