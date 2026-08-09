import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock,
  RefreshCw, Calendar, Loader2, CheckCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceApi } from '../../lib/api';

interface TodaySession {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  schedule_type: string;
  cohort: { id: string; name: string };
  session_open: boolean;
  already_marked: boolean;
  my_status: string | null;
}

interface HistoryRow {
  id: string;
  status: string;
  marked_at: string;
  self_marked: boolean;
  class_schedules: {
    id: string;
    title: string;
    start_time: string;
    schedule_type: string;
  };
}

const STATUS_STYLES: Record<string, string> = {
  present: 'bg-green-500/10 text-green-500',
  absent:  'bg-red-500/10 text-red-500',
  late:    'bg-orange-500/10 text-orange-500',
  excused: 'bg-blue-500/10 text-blue-500',
};

export default function StudentAttendancePage() {
  const { user } = useAuth();

  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Code entry state
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  // ── Fetch today's sessions ──────────────────────────────────────────────
  async function loadToday() {
    setLoadingToday(true);
    try {
      const data = await attendanceApi.getTodaySchedule();
      setTodaySessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingToday(false);
    }
  }

  // ── Fetch attendance history ────────────────────────────────────────────
  async function loadHistory() {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const data = await attendanceApi.getStudentHistory(user.id);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadToday();
    loadHistory();
  }, [user?.id]);

  // ── Submit attendance code ──────────────────────────────────────────────
  async function handleMark(scheduleId: string) {
    const code = (codeInputs[scheduleId] || '').trim().toUpperCase();
    if (!code || code.length < 4) {
      setFeedback(prev => ({ ...prev, [scheduleId]: { ok: false, msg: 'Enter a valid code' } }));
      return;
    }
    setSubmitting(prev => ({ ...prev, [scheduleId]: true }));
    setFeedback(prev => ({ ...prev, [scheduleId]: { ok: false, msg: '' } }));
    try {
      const result = await attendanceApi.selfMark(code);
      setFeedback(prev => ({ ...prev, [scheduleId]: { ok: true, msg: result.message } }));
      // Refresh lists
      await Promise.all([loadToday(), loadHistory()]);
    } catch (e: any) {
      setFeedback(prev => ({
        ...prev,
        [scheduleId]: { ok: false, msg: e?.error || 'Invalid or expired code' }
      }));
    } finally {
      setSubmitting(prev => ({ ...prev, [scheduleId]: false }));
    }
  }

  // ── Stats from history ──────────────────────────────────────────────────
  const total = history.length;
  const present = history.filter(r => r.status === 'present').length;
  const absent = history.filter(r => r.status === 'absent').length;
  const late = history.filter(r => r.status === 'late').length;
  const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Mark your attendance and review your history.</p>
        </div>
        <button
          onClick={() => { loadToday(); loadHistory(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/50 text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Attendance Rate', value: `${pct}%`, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Present', value: present, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Absent', value: absent, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Late', value: late, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-4 rounded-2xl border border-border flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground uppercase font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Today's Sessions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl border border-border overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Today's Classes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter the code from your instructor to mark yourself present.
            </p>
          </div>
          <Calendar size={20} className="text-muted-foreground" />
        </div>

        <div className="p-4 space-y-4">
          {loadingToday ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 size={18} className="animate-spin" /> Loading today's classes…
            </div>
          ) : todaySessions.filter(s => s.session_open || s.already_marked).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
              <Calendar size={28} className="opacity-30" />
              No active attendance sessions right now.
            </div>
          ) : (
            todaySessions.filter(s => s.session_open || s.already_marked).map(session => (
              <motion.div
                key={session.id}
                layout
                className={`rounded-xl border p-4 transition-colors ${
                  session.already_marked
                    ? 'border-green-500/30 bg-green-500/5'
                    : session.session_open
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-secondary/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-sm truncate">{session.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">
                        {session.schedule_type}
                      </span>
                      {session.session_open && !session.already_marked && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold animate-pulse">
                          🟢 Open
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{session.cohort?.name}
                    </p>
                  </div>

                  {/* Action area */}
                  <div className="shrink-0 min-w-[220px]">
                    {session.already_marked ? (
                      <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                        <CheckCheck size={18} />
                        {session.my_status === 'present' ? 'Marked Present' :
                         session.my_status === 'late' ? 'Marked Late' : 'Attendance Recorded'}
                      </div>
                    ) : !session.session_open ? (
                      <p className="text-xs text-muted-foreground italic">
                        Waiting for instructor to open attendance…
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={8}
                            placeholder="Enter code…"
                            value={codeInputs[session.id] || ''}
                            onChange={e => setCodeInputs(prev => ({ ...prev, [session.id]: e.target.value.toUpperCase() }))}
                            onKeyDown={e => e.key === 'Enter' && handleMark(session.id)}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <button
                            onClick={() => handleMark(session.id)}
                            disabled={submitting[session.id]}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
                          >
                            {submitting[session.id]
                              ? <Loader2 size={15} className="animate-spin" />
                              : 'Mark'}
                          </button>
                        </div>
                        <AnimatePresence>
                          {feedback[session.id]?.msg && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={`text-xs font-medium ${
                                feedback[session.id].ok ? 'text-green-500' : 'text-red-400'
                              }`}
                            >
                              {feedback[session.id].ok ? '✓ ' : '✗ '}{feedback[session.id].msg}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Attendance History ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl border border-border overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 size={18} className="animate-spin" /> Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
              <Clock size={28} className="opacity-30" />
              No attendance records yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Class</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Marked By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="p-4 font-medium whitespace-nowrap">
                      {new Date(row.class_schedules?.start_time || row.marked_at).toLocaleDateString([], {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-muted-foreground">{row.class_schedules?.title || '—'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[row.status] || 'bg-secondary text-muted-foreground'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {row.self_marked ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Self</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Instructor</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
