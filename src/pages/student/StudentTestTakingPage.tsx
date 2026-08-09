import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { testsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Question {
  id: string;
  text: string;
  options: string[];
  type: 'mcq';
}

interface Test {
  id: string;
  title: string;
  description?: string;
  duration_mins: number;
  questions: Question[];
  max_score?: number;
}

export default function StudentTestTakingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchTest = async () => {
      setLoading(true);
      try {
        const data = await testsApi.get(id) as Test;
        setTest(data);
        setTimeLeft((data.duration_mins || 30) * 60);
      } catch (err) {
        setError('Failed to load test. It may not be available.');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!test || submitted || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [test, submitted, loading]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = async () => {
    if (!id || !user || submitting) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setError(null);
    try {
      const result = await testsApi.submit(id, answers) as any;
      setScore(result?.attempt?.score ?? null);
      setSubmitted(true);
      // Save submitted test to localStorage
      const key = `submitted_tests_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!saved.includes(id)) {
        localStorage.setItem(key, JSON.stringify([...saved, id]));
      }
    } catch (err: any) {
      if (err?.status === 409) {
        setSubmitted(true); // Already submitted
        setError('You have already submitted this test.');
      } else {
        setError(err?.error || 'Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getGradeLetter = (s: number) => {
    if (s >= 90) return { letter: 'A', color: 'text-green-500' };
    if (s >= 80) return { letter: 'B', color: 'text-blue-500' };
    if (s >= 70) return { letter: 'C', color: 'text-yellow-500' };
    if (s >= 60) return { letter: 'D', color: 'text-orange-500' };
    return { letter: 'F', color: 'text-red-500' };
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test?.questions?.length ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Test Unavailable</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link to="/student/tests" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors">
          Back to Tests
        </Link>
      </div>
    );
  }

  if (submitted) {
    const gradeInfo = score !== null ? getGradeLetter(score) : null;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-3xl font-bold">Test Submitted!</h2>
        {score !== null && gradeInfo ? (
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Your score:</p>
            <div className="flex items-center gap-4 justify-center">
              <span className="text-5xl font-black">{score.toFixed(1)}%</span>
              <span className={`text-5xl font-black ${gradeInfo.color}`}>{gradeInfo.letter}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground max-w-md text-center">Your answers have been submitted and will be graded shortly.</p>
        )}
        <button
          onClick={() => navigate('/student/tests')}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          Return to Tests
        </button>
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Link to="/student/tests" className="p-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock size={14} />
              <span className={timeLeft < 60 ? 'text-red-500 font-bold' : ''}>{formatTime(timeLeft)} Remaining</span>
            </span>
            <span>{answeredCount}/{totalQuestions} Answered</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="hidden sm:block w-32">
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {test.questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-start gap-3 mb-5">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-base font-semibold leading-relaxed">{q.text}</p>
            </div>

            {/* Radio options */}
            <div className="space-y-3 ml-11">
              {(q.options || []).map((opt, oIdx) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <label
                    key={oIdx}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/20 hover:bg-secondary/40 hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={isSelected}
                      onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                      className="accent-primary shrink-0"
                    />
                    <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">{answeredCount} of {totalQuestions} questions answered</p>
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {submitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>
    </div>
  );
}
