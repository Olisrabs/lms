import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Calendar, Search, Pin, RefreshCw } from 'lucide-react';
import { announcementsApi } from '../../lib/api';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  date?: string;
  author?: { full_name: string } | string;
  audience?: string;
  cohorts?: { name: string };
  is_pinned?: boolean;
}

const fallbackAnnouncements: AnnouncementItem[] = [
  { id: '1', title: 'Hackathon Registration Open!', date: 'Today, 09:00 AM', author: 'System Admin', audience: 'All Programs', content: 'Form your teams of 4 and register for the upcoming Winter Hackathon. Amazing prizes to be won!', is_pinned: true },
  { id: '2', title: 'React Module Resources Updated', date: 'Yesterday, 04:30 PM', author: 'Instructor Sarah', audience: 'Cohort 4', content: 'I have uploaded additional reading materials and slide decks for the React Hooks module. Please review them before the next class.' },
  { id: '3', title: 'Platform Maintenance Notice', date: 'Oct 20, 2026', author: 'IT Support', audience: 'All Users', content: 'The LMS will be down for scheduled maintenance this Saturday from 2:00 AM to 4:00 AM EST.' },
];

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(fallbackAnnouncements);
  const [search, setSearch] = useState('');
  const [filterAudience, setFilterAudience] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.list() as any[];
      if (data && data.length > 0) {
        const mapped = data.map((ann: any) => ({
          id: ann.id,
          title: ann.title,
          content: ann.content,
          created_at: ann.created_at,
          date: new Date(ann.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          author: ann.author?.full_name || 'Instructor',
          audience: ann.cohorts?.name || 'All Students',
          is_pinned: ann.is_pinned,
        }));
        setAnnouncements(mapped);
      }
    } catch (e) {
      console.warn('Could not load real announcements, using default list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filtered = announcements.filter((ann) => {
    const q = search.toLowerCase();
    const authorStr = typeof ann.author === 'string' ? ann.author : ann.author?.full_name || '';
    const matchesSearch = ann.title.toLowerCase().includes(q) || ann.content.toLowerCase().includes(q) || authorStr.toLowerCase().includes(q);
    const audienceStr = ann.audience || ann.cohorts?.name || '';
    const matchesAudience = filterAudience === 'All' || audienceStr.toLowerCase().includes(filterAudience.toLowerCase());
    return matchesSearch && matchesAudience;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground mt-1">Stay updated with the latest news, notices, and faculty broadcasts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh announcements"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-44 sm:w-56"
            />
          </div>

          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors cursor-pointer outline-none"
          >
            <option value="All">All Audiences</option>
            <option value="Cohort">Cohort Notices</option>
            <option value="Program">Program Notices</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground border border-border">
            <Megaphone size={40} className="mx-auto mb-3 opacity-30 text-primary" />
            <p className="text-base font-bold text-foreground">No announcements found</p>
            <p className="text-xs mt-1">Try changing your search terms or audience filter.</p>
          </div>
        ) : (
          filtered.map((ann, i) => {
            const authorName = typeof ann.author === 'string' ? ann.author : ann.author?.full_name || 'Faculty';
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-6 border border-border hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Megaphone size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <h2 className="text-lg font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                        {ann.is_pinned && <Pin size={15} className="text-primary fill-primary shrink-0" />}
                        {ann.title}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-secondary px-2.5 py-1 rounded-md w-fit shrink-0">
                        <Calendar size={13} /> {ann.date || 'Recent'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium mb-3">
                      <span className="text-muted-foreground">
                        From: <span className="text-foreground font-semibold">{authorName}</span>
                      </span>
                      <span className="text-border">•</span>
                      <span className="text-muted-foreground">
                        Audience: <span className="text-foreground font-semibold">{ann.audience}</span>
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{ann.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
