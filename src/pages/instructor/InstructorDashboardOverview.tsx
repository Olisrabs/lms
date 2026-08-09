import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, Trophy, Clock, Calendar,
  CheckCircle2, AlertCircle, RefreshCw, BookOpen, GraduationCap, Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, scheduleApi, capstonesApi, assignmentsApi, attendanceApi, programsApi } from '../../lib/api';
import { Link } from 'react-router-dom';

interface InstructorStats {
  totalStudents: number;
  pendingReviews: number;
  activeCapstones: number;
  upcomingClasses: number;
  avgAttendancePct: number | null;
  submittedAssignments: number;
}

interface UpcomingClass {
  id: string;
  title: string;
  start_time: string;
  schedule_type: string;
  cohorts?: { id: string; name: string };
}

interface ActivityItem {
  title: string;
  desc: string;
  time: string;
  type: string;
}

const emptyStats: InstructorStats = {
  totalStudents: 0,
  pendingReviews: 0,
  activeCapstones: 0,
  upcomingClasses: 0,
  avgAttendancePct: null,
  submittedAssignments: 0,
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${day} · ${h % 12 || 12}:${m} ${ampm}`;
}

interface AssignedProgram {
  cohort_id: string;
  program_id: string;
  cohorts?: { id: string; name: string; status: string };
  programs?: { id: string; name: string };
}

export default function InstructorDashboardOverview() {
  const { user } = useAuth();

  const [stats, setStats] = useState<InstructorStats>(emptyStats);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<AssignedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const newStats: InstructorStats = { ...emptyStats };
      const newActivities: ActivityItem[] = [];

      // 0. Fetch instructor's cohort/program assignments
      let assignedCohortId = '';
      let assignedProgramId = '';
      try {
        const assignments = await usersApi.getInstructorAssignments() as AssignedProgram[];
        setAssignedPrograms(assignments || []);
        const activeAssignment = assignments.find((a: any) => a.cohorts?.status === 'active') || assignments[0];
        if (activeAssignment) {
          assignedCohortId = activeAssignment.cohort_id;
          assignedProgramId = activeAssignment.program_id;
        }
      } catch (e) {
        console.warn('Could not load instructor assignments:', e);
        setAssignedPrograms([]);
      }

      // 1. Instructor's class schedule — get upcoming classes
      try {
        const schedule = await scheduleApi.getInstructorSchedule(user.id) as UpcomingClass[];
        const now = new Date();
        const upcoming = (schedule || []).filter(s => new Date(s.start_time) > now);
        setUpcomingClasses(upcoming.slice(0, 3));
        newStats.upcomingClasses = upcoming.length;
      } catch (e) {
        console.warn('Could not load instructor schedule:', e);
      }

      // 2. Students — get students from active cohort + program assigned to this instructor
      if (assignedCohortId) {
        try {
          const students = await programsApi.getStudents(assignedCohortId, assignedProgramId) as any[];
          newStats.totalStudents = students?.length || 0;
        } catch (e) {
          console.warn('Could not load students for instructor:', e);
        }
      }

      // 3. Capstones — pending reviews
      try {
        const capstones = await capstonesApi.list() as any[];
        if (capstones) {
          newStats.activeCapstones = capstones.length;
          const pending = capstones.filter((c: any) =>
            c.status === 'submitted' || c.status === 'reviewing'
          );
          newStats.pendingReviews = pending.length;

          pending.slice(0, 2).forEach((c: any) => {
            newActivities.push({
              title: 'Capstone Pending Review',
              desc: `"${c.title || 'Untitled'}" submitted by a student`,
              time: new Date(c.created_at || Date.now()).toLocaleDateString(),
              type: 'capstone',
            });
          });
        }
      } catch (e) {
        console.warn('Could not load capstones:', e);
      }

      // 4. Assignments — submitted for review
      try {
        const assignments = await assignmentsApi.list() as any[];
        if (assignments) {
          const submitted = assignments.filter((a: any) =>
            a.submissions?.some((s: any) => s.status === 'submitted')
          );
          newStats.submittedAssignments = submitted.length;
        }
      } catch (e) {
        console.warn('Could not load assignments:', e);
      }

      // 5. Attendance — compute avg for instructor's cohorts
      try {
        const attendance = await attendanceApi.list() as any[];
        if (attendance && attendance.length > 0) {
          const withPct = attendance.filter((a: any) => typeof a.attendance_pct === 'number');
          if (withPct.length > 0) {
            const sum = withPct.reduce((acc: number, a: any) => acc + Number(a.attendance_pct), 0);
            newStats.avgAttendancePct = Math.round(sum / withPct.length);
          }
        }
      } catch (e) {
        console.warn('Could not load attendance:', e);
      }

      setStats(newStats);
      setActivities(newActivities);
    } catch (err) {
      console.warn('Failed to load instructor dashboard data:', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user?.id]);

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Upcoming Classes', value: stats.upcomingClasses, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Active Capstones', value: stats.activeCapstones, icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Submissions', value: stats.submittedAssignments, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.full_name || 'Instructor'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live data from database · Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-all flex items-center gap-2 disabled:opacity-50 w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5 border border-border flex flex-col gap-3 relative overflow-hidden group"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              {loading ? (
                <div className="h-7 w-14 bg-secondary animate-pulse rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Programs Assigned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card rounded-3xl p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <GraduationCap size={16} className="text-indigo-500" />
            </div>
            <h2 className="text-lg font-bold">Programs Assigned</h2>
          </div>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-secondary/30 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : assignedPrograms.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-2 text-center">
            <Layers size={26} className="text-muted-foreground" />
            <p className="text-sm font-semibold">No programs assigned yet</p>
            <p className="text-xs text-muted-foreground">Contact your admin to be assigned to a program and cohort.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedPrograms.map((ap, i) => (
              <div key={i} className="p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <BookOpen size={15} className="text-indigo-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{ap.programs?.name ?? 'Unknown Program'}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{ap.cohorts?.name ?? 'Unknown Cohort'}</p>
                    <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ap.cohorts?.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {ap.cohorts?.status ?? 'inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Lower Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-3xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Performance Overview</h2>
              <Link to="/instructor/performance" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Avg. Attendance Rate</p>
                <div className="flex items-end gap-3">
                  {loading ? (
                    <div className="h-8 w-20 bg-secondary animate-pulse rounded-lg" />
                  ) : stats.avgAttendancePct !== null ? (
                    <>
                      <span className="text-3xl font-bold">{stats.avgAttendancePct}%</span>
                      <span className={`text-sm font-medium ${stats.avgAttendancePct >= 70 ? 'text-green-500' : 'text-red-500'}`}>
                        {stats.avgAttendancePct >= 70 ? 'On track' : 'Needs attention'}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">No attendance data yet</span>
                  )}
                </div>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Pending Reviews</p>
                <div className="flex items-end gap-3">
                  {loading ? (
                    <div className="h-8 w-20 bg-secondary animate-pulse rounded-lg" />
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{stats.pendingReviews}</span>
                      <span className={`text-sm font-medium ${stats.pendingReviews > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Classes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass-card rounded-3xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Upcoming Classes</h2>
              <Link to="/instructor/schedule" className="text-sm text-primary hover:underline">View Schedule</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 bg-secondary/30 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <Clock size={28} className="text-muted-foreground" />
                <p className="text-sm font-semibold">No upcoming classes</p>
                <p className="text-xs text-muted-foreground">Schedule classes from the Class Schedule page.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 bg-secondary/30 hover:bg-secondary/50 transition-colors rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <BookOpen size={15} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold truncate">{cls.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.cohorts?.name ?? 'Cohort'} · {formatTime(cls.start_time)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                      {cls.schedule_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-6 border border-border flex flex-col"
        >
          <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-secondary animate-pulse rounded" />
                      <div className="h-3 w-2/3 bg-secondary animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-muted-foreground" />
                </div>
                <p className="font-semibold text-sm">No recent activity</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Capstone submissions and assignment reviews will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                      <Trophy size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.desc}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {activities.length > 0 && (
            <Link
              to="/instructor/capstone"
              className="w-full mt-4 py-2 text-center bg-secondary text-foreground text-sm font-bold rounded-xl hover:bg-secondary/80 transition-colors block"
            >
              View All Capstones
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
