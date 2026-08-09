import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, AlertCircle, PlayCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { testsApi, gradesApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Test {
  id: string;
  title: string;
  description?: string;
  duration_mins?: number;
  is_published: boolean;
  start_time?: string;
  end_time?: string;
  questions?: any[];
}

export default function StudentTestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get student's cohort from grades
        const gradesRes = await gradesApi.getStudentGrades(user.id) as any[];
        const cohortId = gradesRes?.[0]?.cohorts?.id;

        if (cohortId) {
          const data = await testsApi.list(cohortId) as Test[];
          setTests((data || []).filter(t => t.is_published));
        }
      } catch (err) {
        console.error('Failed to fetch tests', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Check if student has already submitted each test
  // We'll store submitted test IDs in localStorage
  const getSubmittedTests = (): Set<string> => {
    try {
      const saved = localStorage.getItem(`submitted_tests_${user?.id}`);
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  };

  const submittedTests = getSubmittedTests();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tests & Quizzes</h1>
        <p className="text-muted-foreground">Take tests assigned by your instructor.</p>
      </div>

      {tests.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border p-16 text-center">
          <CheckSquare size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-bold mb-2">No Tests Available</h3>
          <p className="text-muted-foreground">Your instructor hasn't published any tests yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test, i) => {
            const isCompleted = submittedTests.has(test.id);
            const now = new Date();
            const isAvailable = !test.start_time || (
              now >= new Date(test.start_time) &&
              (!test.end_time || now <= new Date(test.end_time))
            );

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl p-6 border ${isCompleted ? 'border-green-500/30' : 'border-border'} flex flex-col h-full`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CheckSquare size={20} />
                  </div>
                  {isCompleted ? (
                    <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                  ) : isAvailable ? (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <AlertCircle size={12} /> Available
                    </span>
                  ) : (
                    <span className="bg-secondary text-muted-foreground px-3 py-1 rounded-full text-xs font-bold">
                      Not Open
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2">{test.title}</h3>
                {test.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{test.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  <span>{test.questions?.length ?? 0} Questions</span>
                  {test.duration_mins && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={14} />{test.duration_mins} mins</span>
                    </>
                  )}
                </div>

                {test.start_time && (
                  <div className="text-xs text-muted-foreground mb-4">
                    <p>Opens: {new Date(test.start_time).toLocaleString()}</p>
                    {test.end_time && <p>Closes: {new Date(test.end_time).toLocaleString()}</p>}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-border">
                  {isCompleted ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-secondary/50 text-muted-foreground cursor-not-allowed">
                      <CheckCircle2 size={16} /> Completed
                    </div>
                  ) : isAvailable ? (
                    <Link
                      to={`/student/tests/${test.id}`}
                      className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <PlayCircle size={18} /> Start Test
                    </Link>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-secondary/50 text-muted-foreground cursor-not-allowed">
                      Not Yet Open
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
