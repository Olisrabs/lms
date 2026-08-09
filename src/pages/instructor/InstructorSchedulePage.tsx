import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Video, Users, Plus, X, RefreshCw, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { scheduleApi, usersApi } from '../../lib/api';

interface ScheduleSession {
  id: string;
  title: string;
  schedule_type: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  is_cancelled: boolean;
  cohorts?: { id: string; name: string };
}

function formatSessionTime(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const startT = s.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const endT = e.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${startT} – ${endT}`;
}

function isUpcoming(startTime: string) {
  return new Date(startTime) > new Date();
}

export default function InstructorSchedulePage() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<ScheduleSession[]>([]);
  const [activeCohortId, setActiveCohortId] = useState('');
  const [activeCohortName, setActiveCohortName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state — only title, start, end, and optional meeting link
  const [classTitle, setClassTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  // ── Load schedule ──────────────────────────────────────────────────────────
  const loadSchedule = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await scheduleApi.getInstructorSchedule(user.id) as ScheduleSession[];
      setSchedules(data || []);
    } catch (err) {
      console.error('Failed to load instructor schedule:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Load instructor's active cohort ────────────────────────────────────────
  const loadActiveCohort = async () => {
    try {
      const assignments = await usersApi.getInstructorAssignments() as any[];
      const active = assignments.find((a: any) => a.cohorts?.status === 'active') || assignments[0];
      if (active) {
        setActiveCohortId(active.cohort_id);
        setActiveCohortName(active.cohorts?.name || 'Your Cohort');
      }
    } catch (err) {
      console.error('Failed to load instructor assignments:', err);
    }
  };

  useEffect(() => {
    loadSchedule();
    loadActiveCohort();
  }, [user?.id]);

  // ── Create class ───────────────────────────────────────────────────────────
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeCohortId) {
      setError('No active cohort found. Please contact your admin.');
      return;
    }
    if (!classTitle.trim()) { setError('Class title is required.'); return; }
    if (!startTime || !endTime) { setError('Start and end time are required.'); return; }
    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      await scheduleApi.create({
        cohort_id: activeCohortId,
        title: classTitle.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        schedule_type: 'lecture',
        meeting_url: meetingUrl || undefined,
      });
      setIsModalOpen(false);
      setClassTitle('');
      setStartTime('');
      setEndTime('');
      setMeetingUrl('');
      await loadSchedule();
    } catch (err: any) {
      setError(err.error || err.message || 'Failed to create class.');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel class ───────────────────────────────────────────────────────────
  const handleCancelClass = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this class?')) return;
    try {
      await scheduleApi.cancel(id);
      await loadSchedule();
    } catch (err) {
      console.error('Failed to cancel class:', err);
    }
  };

  const upcoming = schedules.filter(s => isUpcoming(s.start_time));
  const past = schedules.filter(s => !isUpcoming(s.start_time));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCohortName
              ? `Cohort: ${activeCohortName} · `
              : ''}
            {upcoming.length} upcoming session{upcoming.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSchedule}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={16} /> Schedule Class
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: schedules.length, color: 'text-primary' },
          { label: 'Upcoming', value: upcoming.length, color: 'text-green-500' },
          { label: 'Past Sessions', value: past.length, color: 'text-muted-foreground' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5 border border-border"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="glass-card rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your schedule…</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Calendar size={26} className="text-muted-foreground" />
          </div>
          <p className="font-semibold">No classes scheduled yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">Click "Schedule Class" to create your first session.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="glass-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <BookOpen size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-base">{session.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={12} />{formatSessionTime(session.start_time, session.end_time)}</span>
                          {session.cohorts?.name && <span className="flex items-center gap-1"><Users size={12} />{session.cohorts.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                      {session.meeting_url && (
                        <a href={session.meeting_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                          <Video size={13} /> Join Live
                        </a>
                      )}
                      <button
                        onClick={() => handleCancelClass(session.id)}
                        className="px-3 py-2 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Sessions</h2>
              <div className="space-y-3">
                {past.map((session) => (
                  <div key={session.id} className="glass-card rounded-2xl border border-border p-5 flex items-center gap-4 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{session.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatSessionTime(session.start_time, session.end_time)}</p>
                    </div>
                    {session.is_cancelled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 shrink-0">Cancelled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-7 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Schedule a Class</h3>
                {activeCohortName && (
                  <p className="text-xs text-muted-foreground mt-0.5">For: {activeCohortName}</p>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Class Title</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. Advanced JavaScript Hooks"
                  value={classTitle}
                  onChange={e => setClassTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Meeting Link <span className="text-muted-foreground/60">(optional)</span></label>
                <input
                  type="url"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="https://zoom.us/j/..."
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !activeCohortId}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {saving ? 'Scheduling…' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
