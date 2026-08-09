import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, BookOpen, Target, CheckCircle2, 
  ArrowRight, Loader2, UploadCloud, Clock, Camera
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { programsApi, usersApi } from '../../lib/api';
import { mockDb } from '../../lib/mockDb';

// ─── Image compression utility ────────────────────────────────────────────────
async function compressImage(file: File, maxSizeKB = 300, maxDimension = 800): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if needed
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

        // Iteratively reduce quality until under maxSizeKB
        let quality = 0.85;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) { resolve(file); return; }
              if (blob.size / 1024 <= maxSizeKB || quality <= 0.3) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        tryCompress();
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function StudentOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [activeCohortId, setActiveCohortId] = useState<string>('');
  const [activeCohortName, setActiveCohortName] = useState<string>('');
  const [availablePrograms, setAvailablePrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  // Photo state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    phone: '',
    dob: '',
    gender: '',
    educationLevel: '',
    currentOccupation: '',
    interests: [] as string[],
  });

  // Per-step validation error
  const [stepError, setStepError] = useState<string | null>(null);

  const validateStep = (): boolean => {
    setStepError(null);
    if (step === 1) {
      if (!formData.phone.trim()) { setStepError('Phone number is required.'); return false; }
      if (!formData.dob) { setStepError('Date of birth is required.'); return false; }
      if (!formData.gender) { setStepError('Please select your gender.'); return false; }
    }
    if (step === 2) {
      if (!formData.educationLevel) { setStepError('Please select your education level.'); return false; }
      if (!formData.currentOccupation) { setStepError('Please select your current occupation.'); return false; }
    }
    if (step === 3) {
      if (registrationOpen && !loadingPrograms && availablePrograms.length > 0 && formData.interests.length === 0) {
        setStepError('Please select a program to continue.');
        return false;
      }
    }
    return true;
  };


  useEffect(() => {
    const fetchActiveCohort = async () => {
      try {
        setLoadingPrograms(true);
        const result = await programsApi.getActiveCohort();
        setRegistrationOpen(result.registrationOpen);
        if (result.activeCohort) {
          setActiveCohortId(result.activeCohort.id);
          setActiveCohortName(result.activeCohort.name);
        }
        setAvailablePrograms(result.programs || []);
      } catch (err) {
        console.error('Failed to fetch active cohort:', err);
        // On fetch error, keep registration as open (don't falsely block students).
        // The server will enforce the real gate on form submission.
        setRegistrationOpen(true);
        setAvailablePrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchActiveCohort();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressImage(file, 300, 800);
      setAvatarFile(compressed);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target!.result as string);
      reader.readAsDataURL(compressed);
    } finally {
      setCompressing(false);
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStepError(null);
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = async () => {
    // Guard: user must be authenticated. Registration status does NOT block
    // profile saving — the student already has an account.
    if (!user) return;
    setCompleteError(null);
    setLoading(true);
    try {
      const selectedProgramName = formData.interests[0] || '';
      const selectedProgram = availablePrograms.find(p => p.name === selectedProgramName);
      const programId = selectedProgram?.id;

      // 1. Upload avatar if one was selected
      if (avatarFile) {
        try {
          await usersApi.uploadAvatar(user.id, avatarFile);
        } catch (avatarErr) {
          console.warn('Avatar upload failed (non-blocking):', avatarErr);
        }
      }

      // 2. Save profile data — phone, dob, gender, education, occupation, program
      await usersApi.updateStudentProfile(user.id, {
        education_level: formData.educationLevel,
        occupation: formData.currentOccupation,
        interests: formData.interests,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        cohort_id: activeCohortId || undefined,
        program_id: programId || undefined,
      });

      mockDb.updateStudentStats({
        programName: selectedProgramName,
        cohortName: activeCohortName || 'Cohort',
      });

      // 3. Clear the onboardingIncomplete flag so ProtectedRoute allows access
      updateUser({ ...user, onboardingIncomplete: false });

      setLoading(false);
      navigate('/student');
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      const msg = err?.error || err?.message || 'Something went wrong. Please try again.';
      setCompleteError(msg);
      setLoading(false);
    }
  };

  const selectInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: [interest]
    }));
  };

  const inputClass = "w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Background', icon: BookOpen },
    { id: 3, title: 'Goals', icon: Target },
    { id: 4, title: 'Complete', icon: CheckCircle2 },
  ];

  // Step 3 "Continue" disabled logic — only disable while loading
  const step3Disabled = loadingPrograms;


  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 border-b border-border bg-background/50 backdrop-blur-md z-10 flex justify-center lg:justify-start">
        <div className="flex items-center gap-2">
          <BookOpen size={28} className="text-primary" />
          <span className="text-2xl font-extrabold tracking-tight text-foreground">Make It Simple</span>
        </div>
      </header>

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

                {/* Avatar Upload */}
                <div className="flex justify-center mb-6">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={clsx(
                      "w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all",
                      avatarPreview
                        ? "border-primary"
                        : "border-muted-foreground/50 bg-secondary group-hover:border-primary"
                    )}>
                      {compressing ? (
                        <Loader2 size={24} className="animate-spin text-primary" />
                      ) : avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <UploadCloud size={24} className="mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">Upload Photo</span>
                        </>
                      )}
                    </div>
                    {/* Camera overlay badge */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-card">
                      <Camera size={14} className="text-primary-foreground" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      id="avatar-upload"
                    />
                  </div>
                </div>
                {avatarFile && (
                  <p className="text-center text-xs text-muted-foreground -mt-4">
                    {avatarFile.name} · {(avatarFile.size / 1024).toFixed(0)} KB
                  </p>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                    <input
                      type="tel" placeholder="+1 (555) 000-0000"
                      className={`${inputClass} ${stepError && !formData.phone.trim() ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                      value={formData.phone}
                      onChange={(e) => { setStepError(null); setFormData({ ...formData, phone: e.target.value }); }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        className={`${inputClass} ${stepError && !formData.dob ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                        value={formData.dob}
                        onChange={(e) => { setStepError(null); setFormData({ ...formData, dob: e.target.value }); }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Gender</label>
                      <select
                        className={`${inputClass} ${stepError && !formData.gender ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                        value={formData.gender}
                        onChange={(e) => { setStepError(null); setFormData({ ...formData, gender: e.target.value }); }}
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
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
                      className={`${inputClass} ${stepError && !formData.educationLevel ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                      value={formData.educationLevel}
                      onChange={(e) => { setStepError(null); setFormData({ ...formData, educationLevel: e.target.value }); }}
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
                      className={`${inputClass} ${stepError && !formData.currentOccupation ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                      value={formData.currentOccupation}
                      onChange={(e) => { setStepError(null); setFormData({ ...formData, currentOccupation: e.target.value }); }}
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

            {/* STEP 3: Program Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Choose Your Program</h2>
                  <p className="text-muted-foreground">Select one of the available programs for the current cohort.</p>
                </div>

                {loadingPrograms ? (
                  <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin text-primary" /> Loading available programs...
                  </div>
                ) : !registrationOpen ? (
                  /* ── Registration Closed ── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-8 px-4 gap-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                      <Clock size={38} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Registration is Currently Closed</h3>
                    <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                      Cohort registration is not open at this time. Please check back later — new cohorts are announced regularly.
                    </p>
                    <div className="mt-2 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400 text-xs font-semibold leading-relaxed">
                      Your profile information has been saved. You can return to complete your enrollment once a new cohort opens.
                    </div>
                  </motion.div>
                ) : availablePrograms.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No programs are currently available. Please contact the administrator.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">Available Programs</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availablePrograms.map((program) => {
                        const isSelected = formData.interests.includes(program.name);
                        return (
                          <button
                            type="button"
                            key={program.id}
                            onClick={() => selectInterest(program.name)}
                            className={clsx(
                              "p-4 rounded-xl border text-sm font-bold transition-all text-left flex flex-col justify-between h-24 relative overflow-hidden",
                              isSelected
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                            )}
                          >
                            <div className="flex items-start justify-between w-full">
                              <span className="font-bold text-base block pr-4">{program.name}</span>
                              {isSelected && <CheckCircle2 size={18} className="text-primary shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: Complete */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 text-center py-8"
              >
                {registrationOpen ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">You're all set!</h2>
                    <p className="text-muted-foreground">Your profile has been created successfully. Welcome to the Make It Simple community.</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-6">
                      <Clock size={48} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Almost there!</h2>
                    <p className="text-muted-foreground">Your profile is saved but cohort registration is currently closed.</p>
                    <div className="mt-4 px-5 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400 text-sm font-medium leading-relaxed">
                      Check back when a new cohort opens — you'll be able to complete enrollment then.
                    </div>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-10 flex flex-col gap-3 pt-6 border-t border-border">

            {/* Step validation error (steps 1-3) */}
            {stepError && (
              <div className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center gap-2">
                <span className="shrink-0">⚠</span> {stepError}
              </div>
            )}

            {/* Completion error (step 4) */}
            {step === 4 && completeError && (
              <div className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center gap-2">
                <span className="shrink-0">⚠</span> {completeError}
              </div>
            )}

            <div className="flex items-center justify-between">
              {/* Back button — steps 2 and 3 only */}
              {step > 1 && step < 4 ? (
                <button
                  onClick={() => { setStepError(null); handlePrev(); }}
                  className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Back
                </button>
              ) : <div />}

              {/* Continue / Go to Dashboard */}
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={step === 3 && step3Disabled}
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className={clsx(
                    "w-full px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    loading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {loading
                    ? <Loader2 size={20} className="animate-spin" />
                    : 'Go to Dashboard'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

