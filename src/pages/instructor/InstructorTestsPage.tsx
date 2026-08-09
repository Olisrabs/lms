import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Search, Eye, BarChart, X, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { testsApi, usersApi } from '../../lib/api';

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  type: 'mcq';
}

interface Test {
  id: string;
  title: string;
  description?: string;
  cohort_id: string;
  duration_mins?: number;
  is_published: boolean;
  start_time?: string;
  end_time?: string;
  questions?: Question[];
  created_at?: string;
}

interface Attempt {
  id: string;
  score?: number;
  submitted_at?: string;
  users?: { id: string; full_name: string; email: string };
  answers?: Record<string, string>;
}

interface Assignment {
  cohort_id: string;
  program_id: string;
  cohorts: { id: string; name: string; status: string };
  programs: { id: string; name: string };
}

function getGrade(score: number | undefined) {
  if (score === undefined || score === null) return { letter: '—', color: 'text-muted-foreground' };
  if (score >= 90) return { letter: 'A', color: 'text-green-500' };
  if (score >= 80) return { letter: 'B', color: 'text-blue-500' };
  if (score >= 70) return { letter: 'C', color: 'text-yellow-500' };
  if (score >= 60) return { letter: 'D', color: 'text-orange-500' };
  return { letter: 'F', color: 'text-red-500' };
}

const emptyQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: '',
  options: ['', '', '', ''],
  correct_answer: '',
  type: 'mcq',
});

export default function InstructorTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewingAttempts, setViewingAttempts] = useState<{ test: Test; attempts: Attempt[] } | null>(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    duration_mins: 30,
    start_time: '',
    end_time: '',
    questions: [emptyQuestion()],
  });

  // Load cohorts
  useEffect(() => {
    const load = async () => {
      try {
        const data = await usersApi.getInstructorAssignments() as Assignment[];
        setAssignments(data || []);
        if (data && data.length > 0) {
          const active = data.find(a => a.cohorts?.status === 'active') || data[0];
          setSelectedCohortId(active.cohort_id);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch tests for cohort
  useEffect(() => {
    if (!selectedCohortId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await testsApi.list(selectedCohortId) as Test[];
        setTests(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedCohortId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId) return;
    const validQ = form.questions.every(q => q.text.trim() && q.correct_answer && q.options.every(o => o.trim()));
    if (!validQ) { setError('All questions must have text, 4 options, and a correct answer.'); return; }

    setSubmitting(true);
    setError(null);
    try {
      await testsApi.create({
        cohort_id: selectedCohortId,
        title: form.title,
        description: form.description || undefined,
        duration_mins: form.duration_mins,
        start_time: form.start_time || new Date().toISOString(),
        end_time: form.end_time || new Date(Date.now() + 7 * 86400000).toISOString(),
        questions: form.questions.map(q => ({ ...q, id: q.id })),
        max_score: 100,
      });
      const updated = await testsApi.list(selectedCohortId) as Test[];
      setTests(updated || []);
      setSuccess('Test created successfully!');
      setShowModal(false);
      setForm({ title: '', description: '', duration_mins: 30, start_time: '', end_time: '', questions: [emptyQuestion()] });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.error || 'Failed to create test.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAttempts = async (test: Test) => {
    setLoadingAttempts(true);
    try {
      const attempts = await testsApi.getAttempts(test.id) as Attempt[];
      setViewingAttempts({ test, attempts: attempts || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handlePublish = async (test: Test) => {
    try {
      await testsApi.publish(test.id, !test.is_published);
      const updated = await testsApi.list(selectedCohortId) as Test[];
      setTests(updated || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
  const removeQuestion = (idx: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  const updateQuestion = (idx: number, field: keyof Question, value: any) =>
    setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q) }));
  const updateOption = (qIdx: number, oIdx: number, value: string) =>
    setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? value : o) } : q) }));

  const filtered = tests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tests & Quizzes</h1>
          <p className="text-muted-foreground">Create and manage your assessments.</p>
        </div>
        <div className="flex items-center gap-3">
          {assignments.length > 1 && (
            <select value={selectedCohortId} onChange={e => setSelectedCohortId(e.target.value)}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {assignments.map((a, i) => <option key={i} value={a.cohort_id}>{a.cohorts?.name} — {a.programs?.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowModal(true)} disabled={!selectedCohortId}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Plus size={20} /> Create Test
          </button>
        </div>
      </div>

      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-semibold">{success}</div>}

      {/* Search */}
      <div className="glass-card rounded-2xl border border-border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input type="text" placeholder="Search tests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {/* Test Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border p-16 text-center">
          <CheckSquare size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-bold mb-2">No Tests Yet</h3>
          <p className="text-muted-foreground mb-6">Create your first test or quiz for students.</p>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90">
            <Plus size={18} /> Create Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((test, i) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl border border-border overflow-hidden flex flex-col">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><CheckSquare size={24} /></div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg ${test.is_published ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {test.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{test.title}</h3>
                {test.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{test.description}</p>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                    <p className="text-muted-foreground mb-1">Questions</p>
                    <p className="font-bold">{test.questions?.length ?? 0}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                    <p className="text-muted-foreground mb-1">Duration</p>
                    <p className="font-bold">{test.duration_mins ?? 0} mins</p>
                  </div>
                </div>
              </div>
              <div className="mt-auto grid grid-cols-2 divide-x divide-border border-t border-border bg-secondary/10">
                <button onClick={() => handlePublish(test)}
                  className="py-3 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors">
                  <Eye size={16} /> {test.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleViewAttempts(test)}
                  className="py-3 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors">
                  <BarChart size={16} /> Submissions
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create New Test</h2>
                <button onClick={() => { setShowModal(false); setError(null); }} className="p-2 hover:bg-secondary rounded-xl transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Test Title *</label>
                    <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. React Core Assessment" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description of the test..." className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Duration (minutes)</label>
                    <input type="number" min={1} value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: Number(e.target.value) }))}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Start Time</label>
                    <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1 block">End Time</label>
                    <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">Questions ({form.questions.length})</h3>
                    <button type="button" onClick={addQuestion}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">
                      <Plus size={14} /> Add Question
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {form.questions.map((q, qIdx) => (
                      <div key={q.id} className="border border-border rounded-xl p-4 bg-secondary/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-sm text-primary">Q{qIdx + 1}</span>
                          {form.questions.length > 1 && (
                            <button type="button" onClick={() => removeQuestion(qIdx)} className="p-1 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <textarea rows={2} required value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                          placeholder="Enter your question here..."
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-3" />

                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Options (radio choices for students)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <input type="text" required value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Correct Answer</label>
                          <select required value={q.correct_answer} onChange={e => updateQuestion(qIdx, 'correct_answer', e.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="">Select correct answer...</option>
                            {q.options.map((opt, oIdx) => opt.trim() && (
                              <option key={oIdx} value={opt}>{String.fromCharCode(65 + oIdx)}: {opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowModal(false); setError(null); }}
                    className="flex-1 py-2.5 bg-secondary rounded-xl font-bold hover:bg-secondary/80 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {submitting ? 'Creating...' : 'Create Test'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submissions Viewer */}
      <AnimatePresence>
        {viewingAttempts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Student Submissions</h2>
                  <p className="text-sm text-muted-foreground">{viewingAttempts.test.title}</p>
                </div>
                <button onClick={() => setViewingAttempts(null)} className="p-2 hover:bg-secondary rounded-xl"><X size={20} /></button>
              </div>

              {loadingAttempts ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : viewingAttempts.attempts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingAttempts.attempts.map(attempt => {
                    const grade = getGrade(attempt.score);
                    const isOpen = expandedAttempt === attempt.id;
                    return (
                      <div key={attempt.id} className="border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-secondary/20 cursor-pointer"
                          onClick={() => setExpandedAttempt(isOpen ? null : attempt.id)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                              {(attempt.users?.full_name || 'S').charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{attempt.users?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-bold">{attempt.score != null ? `${attempt.score}%` : 'Pending'}</p>
                              <p className={`text-xs font-black ${grade.color}`}>{grade.letter}</p>
                            </div>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                        <AnimatePresence>
                          {isOpen && attempt.answers && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-border">
                              <div className="p-4 space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Answers</p>
                                {Object.entries(attempt.answers).map(([qId, answer]) => {
                                  const question = viewingAttempts.test.questions?.find(q => q.id === qId);
                                  const isCorrect = question?.correct_answer === answer;
                                  return (
                                    <div key={qId} className={`p-3 rounded-xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                      <p className="text-xs text-muted-foreground mb-1">{question?.text || qId}</p>
                                      <p className={`text-sm font-medium ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                        {isCorrect ? '✓' : '✗'} {String(answer)}
                                      </p>
                                      {!isCorrect && question?.correct_answer && (
                                        <p className="text-xs text-green-500 mt-1">Correct: {question.correct_answer}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
