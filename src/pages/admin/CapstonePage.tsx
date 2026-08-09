import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Trophy, CheckCircle2,
  UsersRound, X, Edit, Loader2
} from 'lucide-react';
import { capstonesApi } from '../../lib/api';

export default function CapstonePage() {
  const { selectedCohortId } = useOutletContext<{ selectedCohortId: string | null }>();
  const [capstones, setCapstones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCapstone, setSelectedCapstone] = useState<any | null>(null);

  // Review Form State
  const [status, setStatus] = useState('approved');
  const [score, setScore] = useState('85');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchCapstones = async () => {
    try {
      setLoading(true);
      const res = await capstonesApi.list(selectedCohortId || undefined) as any;
      setCapstones(res || []);
    } catch (err) {
      console.error('Failed to load capstones:', err);
      setCapstones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapstones();
  }, [selectedCohortId]);

  const handleOpenReview = (cap: any) => {
    setSelectedCapstone(cap);
    setStatus(cap.status || 'approved');
    setScore(cap.score?.toString() || '85');
    setFeedback(cap.feedback || '');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCapstone) return;
    setError(null);

    setSubmitting(true);
    try {
      await capstonesApi.review(selectedCapstone.id, {
        status,
        score: parseInt(score) || 0,
        feedback
      });
      setIsReviewModalOpen(false);
      setSelectedCapstone(null);
      fetchCapstones();
    } catch (err: any) {
      console.error('Failed to review capstone:', err);
      setError(err.error || err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const activeCount = capstones.filter((c: any) => c.status === 'pending').length;
  const groupCount = capstones.filter((c: any) => c.groups !== null).length;
  const completedCount = capstones.filter((c: any) => c.status === 'approved').length;

  const stats = [
    { label: 'Pending Reviews', value: activeCount.toString(), icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Group Submissions', value: groupCount.toString(), icon: UsersRound, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Approved Capstones', value: completedCount.toString(), icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Capstone Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Review, grade, and approve student final capstone projects.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold mb-6">Submitted Capstones</h3>
        
        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading capstones...</div>
        ) : capstones.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No capstone submissions found for this cohort.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capstones.map((cap) => (
              <div key={cap.id} className="border border-border rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between group bg-secondary/10">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      cap.groups ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {cap.groups ? 'Group' : 'Individual'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      cap.status === 'approved' ? 'bg-accent/10 text-accent' :
                      cap.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {cap.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{cap.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{cap.description || 'No description provided.'}</p>
                  
                  <div className="mb-4 text-xs text-muted-foreground space-y-1 bg-card p-3 border border-border rounded-xl">
                    <p><span className="font-semibold text-foreground">Submitted by:</span> {cap.groups?.name || cap.users?.full_name || 'Student'}</p>
                    {cap.score !== null && <p><span className="font-semibold text-foreground">Grade:</span> {cap.score} pts</p>}
                    {cap.feedback && <p className="line-clamp-2"><span className="font-semibold text-foreground">Feedback:</span> {cap.feedback}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                  <button 
                    onClick={() => handleOpenReview(cap)}
                    className="w-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Edit size={12}/> Review Submission
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Capstone Modal */}
      {isReviewModalOpen && selectedCapstone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Review Capstone Project</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Project Title</label>
                <input 
                  type="text"
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground outline-none"
                  value={selectedCapstone.title}
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Review Status</label>
                  <select 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Score (/100)</label>
                  <input 
                    type="number" 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Evaluation & Feedback</label>
                <textarea 
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" 
                  placeholder="Provide constructive feedback for the students..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
