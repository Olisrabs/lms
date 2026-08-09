import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, Search, Loader2, X, Star } from 'lucide-react';
import { capstonesApi, usersApi } from '../../lib/api';

interface Capstone {
  id: string;
  title: string;
  description?: string;
  status: string;
  score?: number | null;
  feedback?: string;
  submitted_at?: string;
  users?: { id: string; full_name: string; email: string };
  cohort_id?: string;
}

interface Assignment {
  cohort_id: string;
  program_id: string;
  cohorts: { id: string; name: string; status: string };
  programs: { id: string; name: string };
}

export default function InstructorCapstonePage() {
  const [capstones, setCapstones] = useState<Capstone[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showReviewModal, setShowReviewModal] = useState<Capstone | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', score: '', feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        console.error('Failed to load assignments', err);
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCohortId) return;
    const fetchCapstones = async () => {
      setLoading(true);
      try {
        const data = await capstonesApi.list(selectedCohortId) as Capstone[];
        setCapstones(data || []);
      } catch (err) {
        console.error('Failed to fetch capstones', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCapstones();
  }, [selectedCohortId]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReviewModal) return;
    setSubmitting(true);
    setError(null);
    try {
      await capstonesApi.review(showReviewModal.id, {
        status: reviewForm.status as 'approved' | 'rejected' | 'reviewing',
        score: reviewForm.score ? parseFloat(reviewForm.score) : undefined,
        feedback: reviewForm.feedback || undefined,
      });
      const updated = await capstonesApi.list(selectedCohortId) as Capstone[];
      setCapstones(updated || []);
      setSuccess('Capstone reviewed successfully!');
      setShowReviewModal(null);
      setReviewForm({ status: 'approved', score: '', feedback: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      submitted: 'bg-orange-500/10 text-orange-500',
      reviewing: 'bg-blue-500/10 text-blue-500',
      approved: 'bg-green-500/10 text-green-500',
      rejected: 'bg-red-500/10 text-red-500',
      draft: 'bg-secondary text-muted-foreground',
    };
    return map[status] || 'bg-secondary text-muted-foreground';
  };

  const getLetterGrade = (score: number | null | undefined) => {
    if (score === null || score === undefined) return null;
    if (score >= 90) return { letter: 'A', color: 'text-green-500' };
    if (score >= 80) return { letter: 'B', color: 'text-blue-500' };
    if (score >= 70) return { letter: 'C', color: 'text-yellow-500' };
    if (score >= 60) return { letter: 'D', color: 'text-orange-500' };
    return { letter: 'F', color: 'text-red-500' };
  };

  const filtered = capstones.filter(c => {
    const matchesSearch = c.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Capstone Projects</h1>
          <p className="text-muted-foreground">Review and grade final capstone project submissions.</p>
        </div>
        {assignments.length > 1 && (
          <select
            value={selectedCohortId}
            onChange={e => setSelectedCohortId(e.target.value)}
            className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {assignments.map((a, i) => (
              <option key={i} value={a.cohort_id}>
                {a.cohorts?.name} — {a.programs?.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-semibold">
          {success}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search projects or students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option>All</option>
            <option>Submitted</option>
            <option>Reviewing</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-muted-foreground text-sm">Loading capstone submissions...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Trophy size={48} className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No capstone submissions found</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Submissions from students will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="p-4 font-semibold text-sm">Project Title</th>
                  <th className="p-4 font-semibold text-sm">Student</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                  <th className="p-4 font-semibold text-sm text-right">Score / Grade</th>
                  <th className="p-4 font-semibold text-sm text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((proj) => {
                  const grade = getLetterGrade(proj.score);
                  return (
                    <tr key={proj.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <td className="p-4 font-bold text-sm">
                        <div className="flex items-center gap-2">
                          <Trophy size={16} className="text-primary" /> {proj.title}
                        </div>
                        {proj.description && (
                          <p className="text-xs text-muted-foreground mt-1 font-normal line-clamp-1">{proj.description}</p>
                        )}
                      </td>
                      <td className="p-4 text-sm font-medium">{proj.users?.full_name || 'Unknown'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${getStatusBadge(proj.status)}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold">
                        {proj.score != null ? (
                          <span className="flex items-center justify-end gap-2">
                            <span className="text-sm">{proj.score}%</span>
                            {grade && <span className={`text-lg font-black ${grade.color}`}>{grade.letter}</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {proj.status === 'submitted' || proj.status === 'reviewing' ? (
                          <button
                            onClick={() => { setShowReviewModal(proj); setReviewForm({ status: 'approved', score: '', feedback: '' }); }}
                            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            onClick={() => { setShowReviewModal(proj); setReviewForm({ status: proj.status, score: proj.score?.toString() || '', feedback: proj.feedback || '' }); }}
                            className="px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-1 ml-auto"
                          >
                            <CheckCircle2 size={14} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Review Capstone</h2>
                  <p className="text-sm text-muted-foreground mt-1">{showReviewModal.title}</p>
                </div>
                <button onClick={() => setShowReviewModal(null)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-secondary/30 rounded-xl text-sm">
                <p className="font-medium">{showReviewModal.users?.full_name}</p>
                <p className="text-muted-foreground">{showReviewModal.description}</p>
              </div>

              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select
                    value={reviewForm.status}
                    onChange={e => setReviewForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="reviewing">Reviewing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Score (0-100) — Letter Grade</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewForm.score}
                      onChange={e => setReviewForm(f => ({ ...f, score: e.target.value }))}
                      placeholder="Enter score (optional)"
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 pr-16"
                    />
                    {reviewForm.score && (
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-black text-lg ${getLetterGrade(parseFloat(reviewForm.score))?.color}`}>
                        {getLetterGrade(parseFloat(reviewForm.score))?.letter}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">A≥90 · B≥80 · C≥70 · D≥60 · F&lt;60</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Feedback</label>
                  <textarea
                    rows={4}
                    value={reviewForm.feedback}
                    onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                    placeholder="Leave feedback for the student..."
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowReviewModal(null)} className="flex-1 py-2.5 bg-secondary rounded-xl font-bold hover:bg-secondary/80 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
