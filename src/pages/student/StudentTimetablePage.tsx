import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { gradesApi, scheduleApi, usersApi } from '../../lib/api';

interface ScheduleSession {
  id: string;
  title: string;
  schedule_type: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  is_cancelled: boolean;
  users?: { full_name: string };
}

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getSlotKey(isoString: string): string {
  const d = new Date(isoString);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = d.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const timeSlot = `${hour12.toString().padStart(2, '0')}:00 ${ampm}`;
  return `${dayName}-${timeSlot}`;
}

export default function StudentTimetablePage() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<ScheduleSession[]>([]);
  const [cohortName, setCohortName] = useState('');
  const [programName, setProgramName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTimetable = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Primary: fetch student's active enrollment (works immediately after enrolment,
      //    before any grades have been computed)
      let cohortId = '';
      try {
        const enrollment = await usersApi.getStudentEnrollment() as any;
        if (enrollment?.cohort_id) {
          cohortId = enrollment.cohort_id;
          setCohortName(enrollment.cohorts?.name || 'Cohort');
          setProgramName(enrollment.programs?.name || enrollment.cohorts?.programs?.name || 'Program');
        }
      } catch {
        // enrollment endpoint unavailable — fall through to grades
      }

      // 2. Fallback: use grades record if enrollment returned nothing
      if (!cohortId) {
        const gradesResponse = (await gradesApi.getStudentGrades(user.id)) as any[];
        if (gradesResponse && gradesResponse.length > 0) {
          const primary = gradesResponse[0];
          cohortId = primary.cohorts?.id || primary.cohort_id;
          setCohortName(primary.cohorts?.name || 'Cohort');
          setProgramName(primary.cohorts?.programs?.name || 'Program');
        }
      }

      if (cohortId) {
        // 3. Fetch timetable schedule for the resolved cohort
        const data = (await scheduleApi.getForCohort(cohortId)) as ScheduleSession[];
        setSchedules((data || []).filter(s => !s.is_cancelled));
      }
    } catch (err) {
      console.error('Failed to load student timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [user?.id]);

  // Lookup table
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
          <h1 className="text-3xl font-bold">Class Timetable</h1>
          <p className="text-muted-foreground mt-1">
            {programName && cohortName ? (
              <span className="font-medium text-foreground">
                Program: <span className="text-primary">{programName}</span> · Cohort: <span className="text-primary">{cohortName}</span>
              </span>
            ) : (
              'View your weekly class schedule and join live sessions.'
            )}
          </p>
        </div>
        <button
          onClick={loadTimetable}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary/80 transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Timetable
        </button>
      </div>

      {/* Grid Timetable */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Syncing timetable for your cohort…</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="p-4 font-semibold text-xs text-muted-foreground w-28 border-r border-border uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={16} /> Time
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-4 font-semibold text-sm text-center text-foreground border-r border-border last:border-0">
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
                          className="p-2 border-r border-border last:border-0 h-28 align-top w-[18%] hover:bg-secondary/10 transition-colors"
                        >
                          {session ? (
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 h-full flex flex-col justify-between group-hover:shadow-md transition-shadow">
                              <div>
                                <p className="font-bold text-sm text-primary leading-tight mb-1">{session.title}</p>
                                {session.users?.full_name && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users size={11} /> {session.users.full_name}
                                  </p>
                                )}
                              </div>

                              {session.meeting_url ? (
                                <a
                                  href={session.meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full mt-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors shadow-sm"
                                >
                                  <Video size={12} /> Join Live
                                </a>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/70 italic mt-1 block">In-person session</span>
                              )}
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
