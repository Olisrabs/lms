import { motion } from 'framer-motion';
import { 
  PlayCircle, BookOpen, Clock, CheckCircle2, 
  Trophy, TrendingUp, Calendar, Bell, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Overall Progress', value: '68%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Classes Attended', value: '93%', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Assignments Done', value: '12', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Current Grade', value: '90%', icon: Trophy, color: 'text-accent', bg: 'bg-accent/10' },
];

export default function StudentDashboardOverview() {
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome back, <span className="text-gradient">John!</span> 👋</h1>
            <p className="text-muted-foreground text-lg mb-6">"Success is not final, failure is not fatal: it is the courage to continue that counts."</p>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-secondary/50 rounded-xl px-4 py-2 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Program</p>
                <p className="font-bold text-sm">Frontend Engineering</p>
              </div>
              <div className="bg-secondary/50 rounded-xl px-4 py-2 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cohort</p>
                <p className="font-bold text-sm">Cohort 4 (Spring 2026)</p>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center justify-center">
             <div className="w-32 h-32 relative">
               <svg className="w-full h-full" viewBox="0 0 36 36">
                 <path
                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                   fill="none"
                   stroke="rgba(0,0,0,0.1)"
                   strokeWidth="3"
                   className="dark:stroke-white/10"
                 />
                 <path
                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                   fill="none"
                   stroke="var(--primary)"
                   strokeWidth="3"
                   strokeDasharray="68, 100"
                   className="animate-pulse"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-2xl font-bold">68%</span>
               </div>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
          
          {/* Upcoming Class */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 border-l-4 border-l-accent"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Starting in 45m</span>
                </div>
                <h2 className="text-xl font-bold">Advanced React Patterns</h2>
                <p className="text-muted-foreground text-sm">Instructor: Sarah Drasner</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">10:00 AM</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/student/schedule" className="bg-accent text-white px-6 py-2.5 rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
                <PlayCircle size={18} /> Join Class
              </Link>
              <Link to="/student/schedule" className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-secondary/80 transition-colors">
                View Details
              </Link>
            </div>
          </motion.div>

          {/* Learning Progress */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="glass-card rounded-2xl p-6"
          >
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={18} className="text-primary"/> Current Module</h3>
               <Link to="/student/courses" className="text-sm text-primary hover:underline font-medium">Go to Course</Link>
             </div>
             
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="font-medium">React Hooks Deep Dive</span>
                   <span className="text-muted-foreground">4/5 Lessons</span>
                 </div>
                 <div className="w-full bg-secondary rounded-full h-2">
                   <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }}></div>
                 </div>
               </div>
               
               <Link to="/student/courses/1/lesson/1" className="block">
                  <div className="bg-secondary/30 p-4 rounded-xl border border-border flex items-center justify-between group cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <PlayCircle size={20} />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">Lesson 5: Custom Hooks</p>
                        <p className="text-xs text-muted-foreground">25 mins video • 2 readings</p>
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
              {[
                { title: 'Assignment Submitted', desc: 'CSS Grid Challenge', time: '2 hours ago', icon: CheckCircle2, color: 'text-green-500' },
                { title: 'Grade Published', desc: 'JS Fundamentals Quiz (92%)', time: 'Yesterday', icon: Trophy, color: 'text-accent' },
                { title: 'Project Updated', desc: 'Group Project Phase 1', time: '2 days ago', icon: TrendingUp, color: 'text-blue-500' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                  {i !== 2 && <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>}
                  <div className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 z-10 ${activity.color}`}>
                    <activity.icon size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.desc}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              <div className="p-3 bg-secondary/30 rounded-xl border-l-2 border-l-primary flex items-start gap-3">
                <div className="text-center shrink-0">
                  <p className="text-xs font-bold">10:00</p>
                  <p className="text-[10px] text-muted-foreground">AM</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Advanced React</p>
                  <p className="text-xs text-muted-foreground">Live Class</p>
                </div>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border-l-2 border-l-orange-500 flex items-start gap-3">
                <div className="text-center shrink-0">
                  <p className="text-xs font-bold">02:00</p>
                  <p className="text-[10px] text-muted-foreground">PM</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Quiz 4 Due</p>
                  <p className="text-xs text-muted-foreground">Testing & CI/CD</p>
                </div>
              </div>
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
              <div className="group cursor-pointer">
                <p className="text-xs text-muted-foreground mb-1">Today • Admin</p>
                <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">Hackathon Registration is now open! Form your teams.</p>
              </div>
              <div className="w-full h-px bg-border"></div>
              <div className="group cursor-pointer">
                <p className="text-xs text-muted-foreground mb-1">Yesterday • Instructor Sarah</p>
                <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">React Resources updated in the learning portal.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
