import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, Plus, Search, Send, Trash2, CheckCircle2, 
  AlertCircle, RefreshCw, Pin, Calendar, Loader2 
} from 'lucide-react';
import { announcementsApi, usersApi } from '../../lib/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned?: boolean;
  cohort_id?: string | null;
  cohorts?: { id: string; name: string } | null;
  author?: { full_name: string; email: string } | null;
  status?: string;
}

export default function InstructorAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [targetCohortId, setTargetCohortId] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load instructor's cohorts
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const assignments = await usersApi.getInstructorAssignments() as any[];
        if (assignments && assignments.length > 0) {
          const list = assignments
            .map((a: any) => a.cohorts ? { id: a.cohorts.id, name: a.cohorts.name } : null)
            .filter(Boolean) as Array<{ id: string; name: string }>;
          setCohorts(list);
          if (list.length > 0) setTargetCohortId(list[0].id);
        }
      } catch (e) {
        console.warn('Could not load instructor cohorts:', e);
      }
    };
    fetchCohorts();
  }, []);

  // Fetch announcements
  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const cohortParam = selectedCohortFilter !== 'all' ? selectedCohortFilter : undefined;
      const res = await announcementsApi.list(cohortParam) as Announcement[];
      setAnnouncements(res || []);
      if (res && res.length > 0 && !selectedAnn) {
        setSelectedAnn(res[0]);
      }
    } catch (e) {
      console.warn('Failed to load announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [selectedCohortFilter]);

  // Handle Publish Now
  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Please enter both a title and message.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await announcementsApi.create({
        title: title.trim(),
        content: content.trim(),
        cohort_id: targetCohortId || undefined,
        is_pinned: isPinned,
      });

      showToast('Announcement published successfully to your students!');
      setTitle('');
      setContent('');
      setIsPinned(false);
      localStorage.removeItem('instructor_announcement_draft');
      await loadAnnouncements();
    } catch (err: any) {
      showToast(err?.error || err?.message || 'Failed to publish announcement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save Draft
  const handleSaveDraft = () => {
    if (!title.trim() && !content.trim()) {
      showToast('Nothing to save. Write something first.', 'error');
      return;
    }

    const draft = { title, content, targetCohortId, isPinned, date: new Date().toISOString() };
    localStorage.setItem('instructor_announcement_draft', JSON.stringify(draft));
    showToast('Draft saved successfully in browser!');
  };

  // Load draft on mount if available
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('instructor_announcement_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.targetCohortId) setTargetCohortId(parsed.targetCohortId);
        if (parsed.isPinned !== undefined) setIsPinned(parsed.isPinned);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementsApi.delete(id);
      showToast('Announcement removed.');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnn?.id === id) setSelectedAnn(null);
    } catch (e: any) {
      showToast(e?.error || 'Failed to delete announcement', 'error');
    }
  };

  // Filter announcements by search query
  const filtered = announcements.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchTitle = a.title.toLowerCase().includes(q);
    const matchContent = a.content.toLowerCase().includes(q);
    const matchCohort = a.cohorts?.name?.toLowerCase().includes(q) || false;
    return matchTitle || matchContent || matchCohort;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-semibold backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-400'
                : 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Broadcast messages, reminders, and updates to your cohorts.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAnnouncements}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Refresh announcements"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setTitle('');
              setContent('');
              setSelectedAnn(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
          >
            <Plus size={18} /> New Announcement
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Announcements List & Search */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            {/* Search & Cohort Filter */}
            <div className="p-3.5 border-b border-border space-y-2 bg-secondary/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {cohorts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cohort:</span>
                  <select
                    value={selectedCohortFilter}
                    onChange={(e) => setSelectedCohortFilter(e.target.value)}
                    className="flex-1 bg-secondary/50 border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Cohorts</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-border/60 max-h-[520px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-xs animate-pulse space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-secondary rounded w-1/2 mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
                  <Megaphone size={28} className="mx-auto opacity-30 mb-2" />
                  <p className="font-semibold">No announcements found</p>
                  <p className="text-[11px]">Compose a new announcement to notify your cohort.</p>
                </div>
              ) : (
                filtered.map((ann) => {
                  const isSelected = selectedAnn?.id === ann.id;
                  return (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedAnn(ann)}
                      className={`p-4 cursor-pointer transition-all border-l-4 ${
                        isSelected
                          ? 'border-l-primary bg-primary/10'
                          : 'border-l-transparent hover:bg-secondary/40 hover:border-l-border'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-xs text-foreground line-clamp-1 flex items-center gap-1.5">
                          {ann.is_pinned && <Pin size={11} className="text-primary fill-primary shrink-0" />}
                          {ann.title}
                        </h3>
                        <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                          {new Date(ann.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{ann.content}</p>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {ann.cohorts?.name || 'All Students'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ann.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete announcement"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Compose or View Announcement */}
        <div className="lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-border p-6 h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Megaphone size={18} className="text-primary" />
                  {selectedAnn ? 'Announcement Details / Edit' : 'Compose Announcement'}
                </h2>
                {selectedAnn && (
                  <button
                    onClick={() => setSelectedAnn(null)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Switch to New Compose
                  </button>
                )}
              </div>

              {selectedAnn ? (
                /* Detail Preview */
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {selectedAnn.is_pinned && <Pin size={15} className="text-primary fill-primary" />}
                        {selectedAnn.title}
                      </h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(selectedAnn.created_at).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Target: <strong className="text-foreground">{selectedAnn.cohorts?.name || 'All Cohorts'}</strong></span>
                      {selectedAnn.author?.full_name && (
                        <>
                          <span>•</span>
                          <span>Author: <strong className="text-foreground">{selectedAnn.author.full_name}</strong></span>
                        </>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/50 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                      {selectedAnn.content}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Compose Form */}
              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Important reminder: Project Phase 1 deadline extended"
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                      Target Cohort
                    </label>
                    <select
                      value={targetCohortId}
                      onChange={(e) => setTargetCohortId(e.target.value)}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                    >
                      <option value="">Broadcast to All Cohorts</option>
                      {cohorts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium select-none">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Pin to top of student feeds</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                    Message Body
                  </label>
                  <textarea
                    rows={7}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your announcement details, instructions, or meeting links here..."
                    className="w-full bg-secondary/30 border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 bg-secondary text-foreground font-bold text-xs rounded-xl hover:bg-secondary/80 transition-all active:scale-95"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {submitting ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
