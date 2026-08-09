import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, XCircle, Clock, ExternalLink, FileText, Plus, X } from 'lucide-react';
import { assignmentsApi, usersApi } from '../../lib/api';

export default function InstructorAssignmentsPage() {
  const [activeCohort, setActiveCohort] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'graded'>('pending');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [assignmentType, setAssignmentType] = useState('individual');

  // Grading form state
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // 1. Fetch active cohort
  useEffect(() => {
    (usersApi.getInstructorAssignments() as Promise<any[]>).then(res => {
      if (res && res.length > 0) {
        const best = (res as any[]).find((a: any) => a.cohorts?.status === 'active') ?? res[0];
        setActiveCohort(
          best.cohorts
            ? { id: best.cohorts.id, name: best.cohorts.name }
            : { id: best.cohort_id, name: 'Active Cohort' }
        );
      }
    }).catch(console.error);
  }, []);

  // 2. Fetch real student submissions from database
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await assignmentsApi.getSubmissions();
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  // 3. Create Assignment (bound to active cohort)
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Assignment title is required.'); return; }
    if (!dueDate) { setError('Due date is required.'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      if (activeCohort?.id) {
        formData.append('cohort_id', activeCohort.id);
      }
      formData.append('title', title);
      formData.append('description', description);
      formData.append('due_date', new Date(dueDate).toISOString());
      formData.append('max_score', maxScore);
      formData.append('assignment_type', assignmentType);

      await assignmentsApi.create(formData);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setMaxScore('100');
      setAssignmentType('individual');
      alert('Assignment created successfully and published to students!');
    } catch (err: any) {
      setError(err.error || err.message || 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Grade submission
  const handleGradeSubmission = async (sub: any, requestedRevision = false) => {
    setGrading(true);
    try {
      const scoreNum = requestedRevision ? 0 : parseFloat(gradeScore) || 0;
      await assignmentsApi.grade(sub.assignment_id, sub.id, scoreNum, gradeFeedback);
      await loadSubmissions();
      setGradeScore('');
      setGradeFeedback('');
    } catch (err: any) {
      alert(err?.error || 'Failed to submit grade');
    } finally {
      setGrading(false);
    }
  };

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);

  const filtered = submissions.filter(s =>
    activeTab === 'pending' ? s.status === 'submitted' || s.status === 'late' || s.status === 'pending' : s.status === 'graded'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignment Submissions</h1>
          <p className="text-muted-foreground">
            Active Cohort: <span className="font-semibold text-primary">{activeCohort?.name || 'Active Program Cohort'}</span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Create Assignment
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-2 border border-border flex gap-2">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'pending' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}
            >
              Needs Review ({submissions.filter(s => s.status !== 'graded').length})
            </button>
            <button 
              onClick={() => setActiveTab('graded')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'graded' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}
            >
              Graded ({submissions.filter(s => s.status === 'graded').length})
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input type="text" placeholder="Search student submissions..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="divide-y divide-border h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading student submissions...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No {activeTab === 'pending' ? 'pending' : 'graded'} student submissions found in database.
                </div>
              ) : (
                filtered.map((sub) => (
                  <div 
                    key={sub.id} 
                    onClick={() => {
                      setSelectedSubmissionId(sub.id);
                      setGradeScore(sub.score ? String(sub.score) : '');
                      setGradeFeedback(sub.feedback || '');
                    }}
                    className={`p-4 cursor-pointer transition-colors ${selectedSubmissionId === sub.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-secondary/30 border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm">{sub.student?.full_name || 'Enrolled Student'}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold line-clamp-1">{sub.assignment?.title || 'Assignment'}</p>
                    {sub.status === 'graded' ? (
                      <div className="mt-2 text-xs font-bold text-green-500">Score: {sub.score}/{sub.assignment?.max_score || 100}</div>
                    ) : (
                      <div className="mt-2 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded w-fit capitalize">
                        {sub.status || 'submitted'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="md:w-2/3">
          <AnimatePresence mode="wait">
            {selectedSubmission ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-2xl border border-border p-6 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedSubmission.student?.full_name || 'Student'}</h2>
                      <p className="text-muted-foreground font-medium">{selectedSubmission.assignment?.title}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs bg-secondary px-3 py-1.5 rounded-lg font-semibold">
                      <Clock size={14} /> Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {selectedSubmission.content && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Submission Content / URL</h3>
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border text-sm font-mono break-all">
                          {selectedSubmission.content.startsWith('http') ? (
                            <a href={selectedSubmission.content} target="_blank" rel="noreferrer" className="flex items-center justify-between text-primary font-bold hover:underline">
                              <span>{selectedSubmission.content}</span>
                              <ExternalLink size={16} />
                            </a>
                          ) : (
                            <p>{selectedSubmission.content}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Grading & Feedback</h3>
                      <div>
                        <label className="block text-sm font-medium mb-1">Score (Max: {selectedSubmission.assignment?.max_score || 100})</label>
                        <input
                          type="number"
                          max={selectedSubmission.assignment?.max_score || 100}
                          min="0"
                          value={gradeScore}
                          onChange={e => setGradeScore(e.target.value)}
                          placeholder="e.g. 90"
                          className="w-32 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Instructor Feedback</label>
                        <textarea
                          rows={4}
                          value={gradeFeedback}
                          onChange={e => setGradeFeedback(e.target.value)}
                          placeholder="Provide constructive feedback..."
                          className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                  <button
                    onClick={() => handleGradeSubmission(selectedSubmission, true)}
                    disabled={grading}
                    className="px-5 py-2.5 bg-red-500/10 text-red-500 font-bold text-xs rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2"
                  >
                    <XCircle size={16} /> Request Revision
                  </button>
                  <button
                    onClick={() => handleGradeSubmission(selectedSubmission, false)}
                    disabled={grading}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} /> {grading ? 'Publishing...' : 'Publish Grade'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card rounded-2xl border border-border p-6 h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a student submission</p>
                <p className="text-sm">Click on a submission from the list on the left to grade and review feedback.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Assignment Modal (Target cohort input removed; auto-bound to active cohort) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Create Assignment</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned to: <span className="font-semibold text-primary">{activeCohort?.name || 'Active Program'}</span></p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Assignment Title</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. React Hooks Deep Dive"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  placeholder="Details about the assignment..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Assignment Type</label>
                  <select
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={assignmentType}
                    onChange={e => setAssignmentType(e.target.value)}
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Max Score (Points)</label>
                  <input
                    type="number"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={maxScore}
                    onChange={e => setMaxScore(e.target.value)}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {saving ? 'Creating…' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
