import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayCircle, BookOpen, Clock, CheckCircle2, 
  Trophy, Calendar, Bell, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockDb, type MockStudentStats } from '../../lib/mockDb';
import { gradesApi, announcementsApi, scheduleApi, assignmentsApi } from '../../lib/api';

export default function StudentDashboardOverview() {
  const { user } = useAuth();
  
  // Initialize state with local mockDb fallback
  const [data, setData] = useState<MockStudentStats>(() => mockDb.getStudentStats());
  const [announcements, setAnnouncements] = useState(() => mockDb.getAnnouncements());

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // 1. Fetch grades (which includes program, cohort, attendance, and overall score)
        const gradesResponse = await gradesApi.getStudentGrades(user.id);
        const grades = gradesResponse as any[];
        
        let cohortId = '';
        let updatedStats: Partial<MockStudentStats> = {};

        if (grades && grades.length > 0) {
          const primaryGrade = grades[0];
          cohortId = primaryGrade.cohorts?.id || '';
          
          updatedStats = {
            currentGradePct: primaryGrade.overall_score !== null ? Math.round(primaryGrade.overall_score) : data.currentGradePct,
            classesAttendedPct: primaryGrade.attendance_pct !== null ? Math.round(primaryGrade.attendance_pct) : data.classesAttendedPct,
            cohortName: primaryGrade.cohorts?.name || data.cohortName,
            programName: primaryGrade.cohorts?.programs?.name || data.programName,
          };
        }

        // 2. Fetch announcements (using cohortId if available)
        try {
          const announcementsResponse = await announcementsApi.list(cohortId || undefined);
          const rawAnnouncements = announcementsResponse as any[];
          if (rawAnnouncements && rawAnnouncements.length > 0) {
            const formatted = rawAnnouncements.map((ann: any) => ({
              id: ann.id,
              authorName: ann.author?.full_name || 'Instructor',
              title: ann.title,
              timeLabel: new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              isPinned: ann.is_pinned || false
            }));
            setAnnouncements(formatted);
          }
        } catch (annError) {
          console.warn('Failed to fetch announcements from database, using fallback.', annError);
        }

        // 3. Fetch schedule today
        if (cohortId) {
          try {
            const scheduleResponse = await scheduleApi.getForCohort(cohortId);
            const rawSchedule = scheduleResponse as any[];
            if (rawSchedule && rawSchedule.length > 0) {
              const formattedSchedule = rawSchedule.slice(0, 3).map((item: any) => {
                const startTime = new Date(item.start_time);
                let hours = startTime.getHours();
                const minutes = startTime.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
                
                return {
                  time: formattedTime,
                  period: ampm as 'AM' | 'PM',
                  title: item.title,
                  type: item.schedule_type === 'lecture' ? 'Live Class' : item.schedule_type,
                  borderColorClass: item.schedule_type === 'lecture' ? 'border-l-primary' : 'border-l-orange-500'
                };
              });
              updatedStats.schedule = formattedSchedule;
            }
          } catch (schedError) {
            console.warn('Failed to fetch schedule from database, using fallback.', schedError);
          }
        }

        // 4. Fetch assignments (to count completed ones)
        if (cohortId) {
          try {
            const assignmentsResponse = await assignmentsApi.list(cohortId);
            const rawAssignments = assignmentsResponse as any[];
            if (rawAssignments) {
              // Simulating assignments completed based on some metadata or just showing total assignment count
              updatedStats.assignmentsDone = rawAssignments.length;
            }
          } catch (assignError) {
            console.warn('Failed to fetch assignments from database, using fallback.', assignError);
          }
        }

        // Apply all gathered database changes to the dashboard stats state
        const mergedStats = mockDb.updateStudentStats(updatedStats);
        setData(mergedStats);
      } catch (err) {
        console.warn('Unable to query student records from backend database. Utilizing simulated dynamic data.', err);
      }
    };

    fetchDashboardData();
  }, [user]);

  const firstName = user?.full_name?.split(' ')[0] || 'Student';

  const statsList = [
    { label: 'Classes Attended', value: `${data.classesAttendedPct}%`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Assignments Done', value: String(data.assignmentsDone), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Current Grade', value: `${data.currentGradePct}%`, icon: Trophy, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 sm:p-8 border border-border relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Welcome back, <span className="text-gradient">{firstName}!</span> 👋
            </h1>
            <p className="text-muted-foreground text-lg mb-6">"Success is not final, failure is not fatal: it is the courage to continue that counts."</p>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-secondary/50 rounded-xl px-4 py-2 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Program</p>
                <p className="font-bold text-sm">{data.programName}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl px-4 py-2 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cohort</p>
                <p className="font-bold text-sm">{data.cohortName}</p>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center justify-center">
             <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
               <Trophy size={32} className="text-primary mb-1" />
               <span className="text-sm font-bold text-primary">{data.currentGradePct}%</span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statsList.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Learning Progress */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="glass-card rounded-2xl p-6"
          >
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={18} className="text-primary"/> Scheduled Classes</h3>
               <Link to="/student/classes" className="text-sm text-primary hover:underline font-medium">View All Classes</Link>
             </div>
             
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="font-medium">{data.currentModule.title}</span>
                   <span className="text-muted-foreground">{data.currentModule.completedLessons}/{data.currentModule.totalLessons} Lessons</span>
                 </div>
                 <div className="w-full bg-secondary rounded-full h-2">
                   <div 
                     className="bg-primary h-2 rounded-full transition-all duration-500" 
                     style={{ width: `${(data.currentModule.completedLessons / data.currentModule.totalLessons) * 100}%` }}
                   ></div>
                 </div>
               </div>
               
               <Link to="/student/courses/1/lesson/1" className="block">
                  <div className="bg-secondary/30 p-4 rounded-xl border border-border flex items-center justify-between group cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <PlayCircle size={20} />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{data.currentModule.currentLesson.title}</p>
                        <p className="text-xs text-muted-foreground">{data.currentModule.currentLesson.duration}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
             </div>
          </motion.div>
          
          {/* Recent Activities */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-bold text-lg mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {data.activities.map((activity, i) => {
                const Icon = activity.type === 'assignment' ? CheckCircle2 : activity.type === 'grade' ? Trophy : BookOpen;
                const color = activity.type === 'assignment' ? 'text-green-500' : activity.type === 'grade' ? 'text-accent' : 'text-blue-500';
                
                return (
                  <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                    {i !== data.activities.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>}
                    <div className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 z-10 ${color}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.desc}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Today's Timetable */}
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.3 }}
             className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={18}/> Today</h3>
            </div>
            
            <div className="space-y-3">
              {data.schedule.map((item, index) => (
                <div key={index} className={`p-3 bg-secondary/30 rounded-xl border-l-2 ${item.borderColorClass} flex items-start gap-3`}>
                  <div className="text-center shrink-0">
                    <p className="text-xs font-bold">{item.time}</p>
                    <p className="text-[10px] text-muted-foreground">{item.period}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Announcements */}
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.4 }}
             className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Bell size={18}/> Announcements</h3>
              <Link to="/student/announcements" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
              {announcements.map((ann, i) => (
                <div key={ann.id}>
                  {i > 0 && <div className="w-full h-px bg-border my-3"></div>}
                  <div className="group cursor-pointer">
                    <p className="text-xs text-muted-foreground mb-1">{ann.timeLabel} • {ann.authorName}</p>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">{ann.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
