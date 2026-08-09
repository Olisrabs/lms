import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Calendar, Video, RefreshCw, BookOpen, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { gradesApi, scheduleApi, usersApi } from '../../lib/api';

interface ScheduledClass {
  id: string;
  title: string;
  schedule_type: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  is_cancelled: boolean;
  users?: { id: string; full_name: string; avatar_url?: string };
}

function formatClassTime(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const startT = s.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const endT = e.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${startT} – ${endT}`;
}

function getClassStatus(startTime: string, endTime: string): 'upcoming' | 'live' | 'past' {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (now >= start && now <= end) return 'live';
  if (now < start) return 'upcoming';
  return 'past';
}

export default function StudentClassesPage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [cohortName, setCohortName] = useState<string>('');
  const [programName, setProgramName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'live' | 'past'>('all');

  const loadStudentClasses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let cohortId = '';

      // 1. Primary: fetch student's active enrollment (works immediately after enrolment,
      //    before any grades have been computed)
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
          setCohortName(primary.cohorts?.name || 'Assigned Cohort');
          setProgramName(primary.cohorts?.programs?.name || 'Program');
        }
      }

      if (cohortId) {
        // 3. Fetch classes scheduled specifically for this student's cohort
        const scheduleData = (await scheduleApi.getForCohort(cohortId)) as ScheduledClass[];
        setClasses((scheduleData || []).filter(c => !c.is_cancelled));
      }
    } catch (err) {
      console.error('Failed to load student classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentClasses();
  }, [user?.id]);

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.users?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const status = getClassStatus(cls.start_time, cls.end_time);
    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && status === activeFilter;
  });

  const upcomingCount = classes.filter((c) => getClassStatus(c.start_time, c.end_time) === 'upcoming').length;
  const liveCount = classes.filter((c) => getClassStatus(c.start_time, c.end_time) === 'live').length;
  const pastCount = classes.filter((c) => getClassStatus(c.start_time, c.end_time) === 'past').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-1">
            {programName && cohortName ? `${programName} · ${cohortName}` : 'View and join scheduled classes for your active cohort.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadStudentClasses}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-border bg-secondary/50 hover:bg-secondary/80 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-secondary/40 rounded-2xl border border-border overflow-x-auto">
          {[
            { id: 'all', label: `All (${classes.length})` },
            { id: 'live', label: `🔴 Live Now (${liveCount})` },
            { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
            { id: 'past', label: `Past (${pastCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes or instructor..."
            className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-xl"
          />
        </div>
      </div>

      {/* Class List */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading scheduled classes for your cohort…</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Calendar size={26} className="text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">No classes found</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {searchQuery
              ? 'No scheduled classes match your search query.'
              : 'Your instructor has not scheduled any classes for your cohort yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map((cls, index) => {
            const status = getClassStatus(cls.start_time, cls.end_time);

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                  status === 'live'
                    ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30'
                    : status === 'upcoming'
                    ? 'border-border hover:border-primary/30'
                    : 'border-border/60 opacity-80 bg-secondary/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-secondary text-foreground">
                        {cls.schedule_type || 'Lecture'}
                      </span>
                      {status === 'live' && (
                        <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-500 animate-pulse border border-red-500/30 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Class
                        </span>
                      )}
                      {status === 'upcoming' && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          Upcoming
                        </span>
                      )}
                      {status === 'past' && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg leading-snug">{cls.title}</h3>
                    {cls.users?.full_name && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Users size={13} /> Instructor: <span className="font-medium text-foreground">{cls.users.full_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border/50">
                    <Clock size={14} className="shrink-0 text-primary" />
                    <span>{formatClassTime(cls.start_time, cls.end_time)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                  {cls.meeting_url ? (
                    <a
                      href={cls.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        status === 'live'
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 animate-bounce'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                      }`}
                    >
                      <Video size={15} /> Join Class Live
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <BookOpen size={14} /> Classroom session
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
