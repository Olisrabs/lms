import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Megaphone, Plus, Calendar, Clock, Trash2, Users, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementsApi } from '../../lib/api';

export default function AnnouncementsPage() {
  const { selectedCohortId } = useOutletContext<{ selectedCohortId: string | null }>();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.list(selectedCohortId || undefined) as any[];
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCohortId]);

  const handleCreate = async () => {
    if (!title.trim() || !bodyText.trim()) return;
    try {
      await announcementsApi.create({
        title,
        body: bodyText,
        cohort_id: selectedCohortId || undefined,
        is_pinned: isPinned
      });
      setIsModalOpen(false);
      setTitle('');
      setBodyText('');
      setIsPinned(false);
      fetchAnnouncements();
    } catch (err) {
      console.error("Failed to create announcement:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementsApi.delete(id);
      fetchAnnouncements();
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">Broadcast messages to specific cohorts or entire academy.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Create Announcement
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Megaphone size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold">No announcements yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Create an announcement to broadcast messages to your students.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="glass-card rounded-2xl p-5 hover:border-primary/40 transition-colors group relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Megaphone size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{ann.title}</h3>
                    {ann.is_pinned && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-accent/10 text-accent">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{ann.body}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users size={12}/> By {ann.users?.full_name || 'System'}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(ann.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(ann.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl my-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Create Announcement</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                    <input 
                      type="text" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                      placeholder="e.g. Schedule update" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Body Content</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" 
                      placeholder="Type details of your announcement..." 
                      value={bodyText}
                      onChange={e => setBodyText(e.target.value)}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-foreground pt-2">
                    <input 
                      type="checkbox"
                      checked={isPinned}
                      onChange={e => setIsPinned(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary/50"
                    />
                    Pin Announcement
                  </label>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreate}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
