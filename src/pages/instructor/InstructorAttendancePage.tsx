import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Check, X, Clock, AlertCircle, Download,
  RefreshCw, Play, Square, Save, Search, Plus, CalendarDays
} from 'lucide-react';
import { attendanceApi, scheduleApi, usersApi } from '../../lib/api';

type AttStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  attendanceId?: string;
  status: AttStatus | null;
  note?: string;
  self_marked?: boolean;
}

interface SessionItem {
  id: string;
  code: string;
  is_open: boolean;
  open_until: string | null;
  created_at: string;
  schedule_id: string;
  cohort_id: string;
  schedule?: {
    id: string;
    title: string;
  };
  cohort?: {
    id: string;
    name: string;
  };
}

const STATUS_STYLES: Record<AttStatus, string> = {
  present: 'bg-green-500/10 text-green-500',
  absent:  'bg-red-500/10 text-red-500',
  late:    'bg-orange-500/10 text-orange-500',
  excused: 'bg-blue-500/10 text-blue-500',
};

const STATUS_ICON: Record<AttStatus, JSX.Element> = {
  present: <Check size={13} />,
  absent:  <X size={13} />,
  late:    <Clock size={13} />,
  excused: <AlertCircle size={13} />,
};

export default function InstructorAttendancePage() {
  const [activeCohort, setActiveCohort] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);

  // Modals & UI state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [openMinutes, setOpenMinutes] = useState(30);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // ── 1. Load active cohort & schedules ────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const assignments = await usersApi.getInstructorAssignments() as any[];
        if (assignments && assignments.length > 0) {
          // Always prefer the cohort that is actively running
          const best = assignments.find((a: any) => a.cohorts?.status === 'active') ?? assignments[0];
          const cohortObj = best.cohorts
            ? { id: best.cohorts.id, name: best.cohorts.name }
            : { id: best.cohort_id, name: 'Active Cohort' };
          setActiveCohort(cohortObj);

          // Fetch schedules for the correct cohort — only upcoming or current classes
          // (start_time >= 4 hours ago so an instructor can still take attendance
          //  for a class that started a bit earlier)
          const allSchedules = await scheduleApi.getForCohort(cohortObj.id) as any[];
          const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 h ago
          const upcoming = (allSchedules || []).filter(
            (s: any) => new Date(s.start_time) >= cutoff
          );
          setSchedules(upcoming);
        }
      } catch (err) {
        console.error('Failed to load active cohort:', err);
      }
    }
    init();
  }, []);

  // ── 2. Load past & active sessions for active cohort ─────────────────────
  const loadSessions = useCallback(async () => {
    if (!activeCohort?.id) return;
    try {
      setLoading(true);
      const res = await attendanceApi.getSessions({ cohort_id: activeCohort.id });
      const sessionList: SessionItem[] = res || [];
      setPastSessions(sessionList);

      const openSess = sessionList.find(s => s.is_open);
      setActiveSession(openSess || null);

      // Only auto-select the first session if nothing is currently selected
      setSelectedSessionId(prev => {
        if (!prev && sessionList.length > 0) return sessionList[0].id;
        return prev;
      });
    } catch (err) {
      console.error('Failed to load attendance sessions:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCohort?.id]); // ← do NOT include selectedSessionId here; that caused an infinite loop

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── 3. Load students & attendance for selected session ───────────────────
  const loadAttendanceForSession = useCallback(async () => {
    if (!selectedSessionId) return;
    const currentSess = pastSessions.find(s => s.id === selectedSessionId);
    if (!currentSess) return;

    try {
      const records = await attendanceApi.getForSession(currentSess.schedule_id);
      const rows: StudentRow[] = (records || []).map((r: any) => ({
        id: r.student?.id || r.student_id,
        full_name: r.student?.full_name || 'Student',
        email: r.student?.email || '',
        avatar_url: r.student?.avatar_url,
        attendanceId: r.id,
        status: (r.status as AttStatus) || 'absent',
        note: r.note,
        self_marked: r.self_marked,
      }));
      setStudents(rows);
    } catch (err) {
      console.error('Failed to load session attendance:', err);
    }
  }, [selectedSessionId, pastSessions]);

  useEffect(() => {
    loadAttendanceForSession();
  }, [loadAttendanceForSession]);

  // ── Countdown timer for session ───────────────────────────────────────────
  useEffect(() => {
    if (!activeSession?.is_open || !activeSession.open_until) { setTimeLeft(''); return; }
    const tick = () => {
      const diff = new Date(activeSession.open_until!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')} left`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  // ── 4. Create Session ─────────────────────────────────────────────────────
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCohort?.id) return;
    setSessionLoading(true);

    try {
      let targetScheduleId = selectedScheduleId;

      // If user provided custom schedule title, create schedule first
      if (!targetScheduleId && newScheduleTitle.trim()) {
        const newSched = await scheduleApi.create({
          cohort_id: activeCohort.id,
          title: newScheduleTitle.trim(),
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          schedule_type: 'lecture',
        }) as any;
        targetScheduleId = newSched.id;
      }

      if (!targetScheduleId) {
        alert('Please select or enter a class schedule title');
        setSessionLoading(false);
        return;
      }

      const newSess = await attendanceApi.openSession({
        schedule_id: targetScheduleId,
        cohort_id: activeCohort.id,
        open_minutes: openMinutes,
      });

      setIsCreateModalOpen(false);
      setNewScheduleTitle('');
      setSelectedScheduleId('');
      await loadSessions();
      if (newSess?.id) setSelectedSessionId(newSess.id);
    } catch (err: any) {
      alert(err?.error || err?.message || 'Failed to create attendance session');
    } finally {
      setSessionLoading(false);
    }
  };

  // ── Close active session ──────────────────────────────────────────────────
  const handleCloseSession = async () => {
    if (!activeSession) return;
    setSessionLoading(true);
    try {
      await attendanceApi.closeSession(activeSession.id);
      await loadSessions();
    } catch (err: any) {
      alert(err?.error || 'Failed to close session');
    } finally {
      setSessionLoading(false);
    }
  };

  const copyCode = () => {
    if (!activeSession?.code) return;
    navigator.clipboard.writeText(activeSession.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const setStudentStatus = (studentId: string, status: AttStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleSave = async () => {
    const currentSess = pastSessions.find(s => s.id === selectedSessionId);
    if (!currentSess) return;
    setSaving(true);
    try {
      await attendanceApi.markBulk(
        currentSess.schedule_id,
        students.map(s => ({ student_id: s.id, status: s.status || 'absent', note: s.note }))
      );
      await loadAttendanceForSession();
    } catch (err: any) {
      alert(err?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const downloadCSV = () => {
    const rows = [['Student Name', 'Email', 'Status', 'Method', 'Class Schedule ID']];
    students.forEach(s => {
      rows.push([s.full_name, s.email, s.status || 'absent', s.self_marked ? 'Self-marked' : 'Instructor', selectedSessionId || '']);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_session_${selectedSessionId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSession = pastSessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Hub</h1>
          <p className="text-muted-foreground">
            Active Cohort: <span className="font-semibold text-primary">{activeCohort?.name || 'Active Cohort'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
          >
            <Plus size={18} /> Create Attendance Session
          </button>
          <button
            onClick={loadSessions}
            className="p-2.5 border border-border bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Active Session Banner ── */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl border border-primary/40 bg-primary/5 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Active Session Open
                </span>
                <span className="text-xs text-muted-foreground">
                  Schedule ID: {activeSession.schedule_id}
                </span>
              </div>
              <h2 className="text-xl font-bold">{activeSession.schedule?.title || 'Class Session'}</h2>
              <p className="text-xs text-muted-foreground mt-1">Students are automatically marked absent until they enter the code or mark present.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Session Code</p>
                <button
                  onClick={copyCode}
                  className="font-mono text-3xl font-bold tracking-[0.25em] bg-background px-4 py-2 rounded-xl border border-border hover:border-primary/40 transition-colors"
                >
                  {activeSession.code}
                </button>
                {codeCopied && <p className="text-[10px] text-green-500 font-bold mt-1">Copied!</p>}
              </div>

              {timeLeft && (
                <div className="text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Time Left</p>
                  <div className="text-sm font-bold text-orange-500 bg-orange-500/10 px-3 py-2 rounded-xl">
                    ⏱ {timeLeft}
                  </div>
                </div>
              )}

              <button
                onClick={handleCloseSession}
                disabled={sessionLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 font-semibold text-sm rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Square size={16} /> Close Session
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Sessions & Attendance Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: List of Past & Active Sessions */}
        <div className="glass-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CalendarDays size={20} className="text-primary" /> Session History
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">{pastSessions.length} Sessions</span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {pastSessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No sessions created yet. Click 'Create Attendance Session' above to start!
              </div>
            ) : (
              pastSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedSessionId === sess.id
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      sess.is_open ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {sess.is_open ? 'OPEN' : 'CLOSED'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(sess.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm line-clamp-1">{sess.schedule?.title || 'Class Session'}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                    Schedule ID: {sess.schedule_id.slice(0, 13)}…
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Student Attendance List */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSession ? (
            <div className="glass-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="font-bold text-lg">{selectedSession.schedule?.title || 'Class Session'}</h3>
                  <p className="text-xs text-muted-foreground">
                    Class Scheduled ID: <span className="font-mono text-foreground font-semibold">{selectedSession.schedule_id}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-secondary/50 hover:bg-secondary"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50"
                  >
                    <Save size={14} /> {saving ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                  <input
                    type="text"
                    placeholder="Search enrolled students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <button
                  onClick={() => setStudents(prev => prev.map(s => ({ ...s, status: 'present' })))}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-green-500/10 text-green-500 hover:bg-green-500/20 shrink-0"
                >
                  Mark All Present
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/40 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Source</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No student records for this session.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => (
                        <tr key={student.id} className="hover:bg-secondary/10">
                          <td className="p-3">
                            <p className="font-semibold text-xs">{student.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{student.email}</p>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 inline-flex items-center gap-1 rounded-md text-xs font-bold capitalize ${STATUS_STYLES[student.status || 'absent']}`}>
                              {STATUS_ICON[student.status || 'absent']}
                              {student.status || 'absent'}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {student.self_marked ? (
                              <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-[10px]">Student Marked</span>
                            ) : (
                              'Auto / Instructor'
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(['present', 'absent', 'late'] as AttStatus[]).map(st => (
                                <button
                                  key={st}
                                  onClick={() => setStudentStatus(student.id, st)}
                                  className={`px-2 py-1 text-[11px] rounded font-semibold capitalize ${
                                    student.status === st ? STATUS_STYLES[st] : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-lg">Select a session from the list</p>
              <p className="text-sm mt-1">Select a past session to view student attendance or create a new session.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xl font-bold">Create Attendance Session</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Select Existing Class Schedule</label>
                <select
                  value={selectedScheduleId}
                  onChange={e => setSelectedScheduleId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">— Select Schedule —</option>
                  {schedules.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({new Date(s.start_time).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedScheduleId && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">OR Enter Class Scheduled Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Lecture - React Hooks"
                    value={newScheduleTitle}
                    onChange={e => setNewScheduleTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Window Duration (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={openMinutes}
                  onChange={e => setOpenMinutes(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="bg-secondary/30 p-3 rounded-xl border border-border text-xs text-muted-foreground">
                ℹ️ When created, all students enrolled in this program for your cohort will be automatically marked <span className="font-bold text-red-500">Absent</span> until they mark attendance.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sessionLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <Play size={16} /> {sessionLoading ? 'Creating...' : 'Create & Start Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
