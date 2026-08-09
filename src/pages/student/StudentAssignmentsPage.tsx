import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Clock, Upload, CheckCircle2, Link as LinkIcon,
  RefreshCw, Star, MessageSquare, AlertCircle, ExternalLink
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { assignmentsApi } from '../../lib/api';

type SubmissionStatus = 'submitted' | 'late' | 'graded' | null;

interface Submission {
  id: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  content: string | null;
  submitted_at: string;
  graded_at: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  max_score: number;
  due_date: string;
  is_published: boolean;
  attachments: string[];
  created_at: string;
  submissions: Submission[];
}

const STATUS_CONFIG: Record<
  NonNullable<SubmissionStatus> | 'pending',
  { label: string; bg: string; icon: JSX.Element }
> = {
  pending:   { label: 'Pending',   bg: 'bg-orange-500/10 text-orange-500',  icon: <Clock size={12} /> },
  submitted: { label: 'Submitted', bg: 'bg-blue-500/10 text-blue-500',      icon: <CheckCircle2 size={12} /> },
  late:      { label: 'Late',      bg: 'bg-red-500/10 text-red-500',        icon: <AlertCircle size={12} /> },
  graded:    { label: 'Graded',    bg: 'bg-green-500/10 text-green-500',    icon: <Star size={12} /> },
};

function getStatusKey(submission: Submission | undefined): 'pending' | NonNullable<SubmissionStatus> {
  if (!submission) return 'pending';
  return submission.status || 'submitted';
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmission, setActiveSubmission] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentsApi.list();
      setAssignments((data as any) || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleSubmit = async (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    if (!submissionUrl.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', submissionUrl.trim());
      await assignmentsApi.submit(assignmentId, formData);
      setActiveSubmission(null);
      setSubmissionUrl('');
      await loadAssignments();
    } catch (err: any) {
      alert(err?.error || err?.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (dueDate: string) => new Date() > new Date(dueDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">View and submit your course assignments.</p>
        </div>
        <button
          onClick={loadAssignments}
          className="p-2.5 border border-border bg-secondary/50 rounded-xl hover:bg-secondary transition-colors w-fit"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse font-medium">
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <FileText size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold text-lg">No assignments available</p>
          <p className="text-sm mt-1">Assignments posted by your instructor will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment, index) => {
            const mySubmission = assignment.submissions?.[0];
            const statusKey = getStatusKey(mySubmission);
            const statusCfg = STATUS_CONFIG[statusKey];
            const isGraded = statusKey === 'graded';
            const isSubmitted = !!mySubmission;
            const canSubmit = !isSubmitted && !isGraded;
            const scorePct = isGraded && mySubmission?.score != null
              ? Math.round((mySubmission.score / assignment.max_score) * 100)
              : null;

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`glass-card rounded-2xl border flex flex-col h-full overflow-hidden transition-colors ${
                  isGraded
                    ? 'border-green-500/30 bg-green-500/3'
                    : statusKey === 'late'
                    ? 'border-red-500/20'
                    : 'border-border'
                }`}
              >
                {/* Card Header */}
                <div className="p-6 pb-0 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isGraded ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                    }`}>
                      {isGraded ? <Star size={24} /> : <FileText size={24} />}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${statusCfg.bg}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-1">{assignment.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {assignment.description || 'No description provided.'}
                  </p>

                  {/* Due date */}
                  <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                    !isSubmitted && isOverdue(assignment.due_date) ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    <Clock size={13} />
                    Due: {new Date(assignment.due_date).toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                    })}
                    {!isSubmitted && isOverdue(assignment.due_date) && (
                      <span className="ml-1 text-red-500 font-bold">· Overdue</span>
                    )}
                  </div>

                  {/* Submitted content link */}
                  {mySubmission?.content && (
                    <div className="mt-3 flex items-center gap-2 bg-secondary/40 border border-border rounded-xl px-3 py-2">
                      <LinkIcon size={13} className="text-primary shrink-0" />
                      <a
                        href={mySubmission.content.startsWith('http') ? mySubmission.content : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary font-medium truncate flex items-center gap-1 hover:underline"
                      >
                        {mySubmission.content}
                        {mySubmission.content.startsWith('http') && <ExternalLink size={10} />}
                      </a>
                    </div>
                  )}

                  {/* Submitted at */}
                  {mySubmission?.submitted_at && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Submitted: {new Date(mySubmission.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Grade Card — shown when graded */}
                <AnimatePresence>
                  {isGraded && mySubmission && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mx-4 mb-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3"
                    >
                      {/* Score */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-green-500" />
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            Score: {mySubmission.score} / {assignment.max_score}
                          </span>
                        </div>
                        <span className={`text-sm font-extrabold ${
                          scorePct! >= 70 ? 'text-green-500' : scorePct! >= 50 ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {scorePct}%
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${scorePct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            scorePct! >= 70 ? 'bg-green-500' : scorePct! >= 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        />
                      </div>

                      {/* Instructor feedback */}
                      {mySubmission.feedback && (
                        <div className="flex gap-2 bg-background/60 border border-border rounded-lg p-3">
                          <MessageSquare size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                              Instructor Feedback
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">{mySubmission.feedback}</p>
                          </div>
                        </div>
                      )}

                      {mySubmission.graded_at && (
                        <p className="text-[10px] text-muted-foreground text-right">
                          Graded: {new Date(mySubmission.graded_at).toLocaleString()}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="mt-auto border-t border-border bg-secondary/10">
                  <AnimatePresence mode="wait">
                    {activeSubmission === assignment.id ? (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6"
                        onSubmit={(e) => handleSubmit(e, assignment.id)}
                      >
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                          Submission URL / Link / Content
                        </label>
                        <div className="relative mb-4">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <input
                            type="text"
                            placeholder="https://github.com/... or submission note"
                            required
                            value={submissionUrl}
                            onChange={e => setSubmissionUrl(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => { setActiveSubmission(null); setSubmissionUrl(''); }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {submitting ? 'Submitting...' : 'Confirm Submit'}
                          </button>
                        </div>
                      </motion.form>
                    ) : (
                      <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
                        {canSubmit ? (
                          <button
                            onClick={() => setActiveSubmission(assignment.id)}
                            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all"
                          >
                            Submit Assignment <Upload size={16} />
                          </button>
                        ) : (
                          <div className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${
                            isGraded
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : statusKey === 'late'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {statusCfg.icon}
                            {isGraded
                              ? 'Assignment Graded'
                              : statusKey === 'late'
                              ? 'Submitted Late'
                              : 'Submitted'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
