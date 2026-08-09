import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users, Plus, X, RefreshCw, Video, Trash2, Loader2 } from 'lucide-react';
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

const TYPE_COLORS: Record<string, string> = {
  lecture: 'bg-primary/10 text-primary border-primary/20',
  lab: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  workshop: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  exam: 'bg-red-500/10 text-red-500 border-red-500/20',
  office_hours: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

function getSlotKey(isoString: string): string {
  const d = new Date(isoString);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = d.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const timeSlot = `${hour12.toString().padStart(2, '0')}:00 ${ampm}`;
  return `${dayName}-${timeSlot}`;
}

export default function InstructorTimetablePage() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<ScheduleSession[]>([]);
  const [activeCohortId, setActiveCohortId] = useState('');
  const [activeCohortName, setActiveCohortName] = useState('');
  const [activeProgramName, setActiveProgramName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State for Add Time Slot modal
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotTime, setSlotTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState('1');
  const [title, setTitle] = useState('');
  const [scheduleType, setScheduleType] = useState('lecture');
  const [meetingUrl, setMeetingUrl] = useState('');

  const loadAssignmentsAndSchedule = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Get instructor's active assignment — active cohort takes priority
      const assignments = (await usersApi.getInstructorAssignments()) as any[];
      const active = assignments.find((a: any) => a.cohorts?.status === 'active') ?? assignments[0];

      if (active) {
        setActiveCohortId(active.cohort_id);
        setActiveCohortName((active.cohorts as any)?.name || 'Your Cohort');
        // programs is a direct object from the enriched backend response
        setActiveProgramName((active.programs as any)?.name || (active.cohorts as any)?.name || '');
      }

      // 2. Get instructor's schedule
      const data = (await scheduleApi.getInstructorSchedule(user.id)) as ScheduleSession[];
      setSchedules((data || []).filter(s => !s.is_cancelled));
    } catch (err) {
      console.error('Failed to load timetable data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignmentsAndSchedule();
  }, [user?.id]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeCohortId) {
      setError('No active cohort found. Please contact an admin.');
      return;
    }
    if (!title.trim()) {
      setError('Class title is required.');
      return;
    }

    setSaving(true);
    try {
      // Calculate target date for chosen day of week
      const targetDayIdx = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(slotDay);
      const now = new Date();
      let diff = (targetDayIdx + 7 - now.getDay()) % 7;
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);

      const [hours, minutes] = slotTime.split(':').map(Number);
      const startTime = new Date(targetDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + Number(durationHours));

      await scheduleApi.create({
        cohort_id: activeCohortId,
        title: title.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        schedule_type: scheduleType,
        meeting_url: meetingUrl || undefined,
      });

      setIsModalOpen(false);
      setTitle('');
      setMeetingUrl('');
      setScheduleType('lecture');
      await loadAssignmentsAndSchedule();
    } catch (err: any) {
      setError(err.error || err.message || 'Failed to create time slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSlot = async (id: string) => {
    if (!confirm('Remove this time slot from the schedule?')) return;
    try {
      await scheduleApi.cancel(id);
      await loadAssignmentsAndSchedule();
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  // Map sessions into a grid lookup table
  const scheduleMap: Record<string, ScheduleSession> = {};
  schedules.forEach(session => {
    const key = getSlotKey(session.start_time);
    scheduleMap[key] = session;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Timetable Builder</h1>
          <p className="text-muted-foreground mt-1">
            {activeProgramName && activeCohortName ? (
              <span className="font-medium text-foreground">
                Program: <span className="text-primary">{activeProgramName}</span> · Cohort: <span className="text-primary">{activeCohortName}</span>
              </span>
            ) : (
              'Plan and manage your weekly cohort timetable.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAssignmentsAndSchedule}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
          >
            <CalendarIcon size={18} /> Add Time Slot
          </button>
        </div>
      </div>

      {/* Grid Timetable */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="p-4 w-28 border-r border-border text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Clock size={16} /> Time
                </th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 text-center font-bold text-sm border-r border-border last:border-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time} className="border-b border-border/50 group">
                  <td className="p-4 text-xs font-bold text-muted-foreground border-r border-border bg-secondary/10 whitespace-nowrap">
                    {time}
                  </td>
                  {DAYS.map(day => {
                    const session = scheduleMap[`${day}-${time}`];

                    return (
                      <td
                        key={`${day}-${time}`}
                        className="p-2 border-r border-border last:border-0 h-32 align-top hover:bg-secondary/10 transition-colors w-[18%]"
                      >
                        {session ? (
                          <div
                            className={`h-full border rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-all group/card relative overflow-hidden ${
                              TYPE_COLORS[session.schedule_type] || 'bg-primary/10 text-primary border-primary/20'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-xs font-bold leading-tight mb-1">{session.title}</p>
                                <button
                                  onClick={() => handleRemoveSlot(session.id)}
                                  className="text-red-400 hover:text-red-600 opacity-0 group-hover/card:opacity-100 transition-opacity p-0.5"
                                  title="Remove slot"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] opacity-80 mt-1">
                                <Users size={11} /> {session.cohorts?.name || activeCohortName}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-background/50">
                                {session.schedule_type}
                              </span>
                              {session.meeting_url && (
                                <a
                                  href={session.meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold underline flex items-center gap-0.5"
                                >
                                  <Video size={10} /> Link
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const [hStr, ampm] = time.split(' ');
                              const [h] = hStr.split(':').map(Number);
                              const h24 = ampm === 'PM' && h !== 12 ? h + 12 : ampm === 'AM' && h === 12 ? 0 : h;
                              setSlotDay(day);
                              setSlotTime(`${h24.toString().padStart(2, '0')}:00`);
                              setIsModalOpen(true);
                            }}
                            className="w-full h-full rounded-xl border border-dashed border-border/40 hover:border-primary/40 flex items-center justify-center text-muted-foreground/30 hover:text-primary transition-all opacity-0 hover:opacity-100"
                          >
                            <Plus size={18} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Time Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-7 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Add Timetable Slot</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  For: <span className="font-semibold text-primary">{activeProgramName} ({activeCohortName})</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Class Title</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. React Architecture & State"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Day of Week</label>
                  <select
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={slotDay}
                    onChange={e => setSlotDay(e.target.value)}
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={slotTime}
                    onChange={e => setSlotTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Duration (Hours)</label>
                  <select
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={durationHours}
                    onChange={e => setDurationHours(e.target.value)}
                  >
                    <option value="1">1 Hour</option>
                    <option value="1.5">1.5 Hours</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                  <select
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={scheduleType}
                    onChange={e => setScheduleType(e.target.value)}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="workshop">Workshop</option>
                    <option value="exam">Exam</option>
                    <option value="office_hours">Office Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Meeting Link <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="url"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="https://zoom.us/j/..."
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !activeCohortId}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving ? 'Adding…' : 'Add Slot'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
