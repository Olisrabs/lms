import { motion } from 'framer-motion';
import { 
  Users, UserSquare2, GraduationCap, Clock, 
  FileText, Trophy, ArrowUpRight, TrendingUp,
  MoreVertical, CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const statCards = [
  { label: 'Total Students', value: '4,521', trend: '+12.5%', isUp: true, icon: Users },
  { label: 'Total Instructors', value: '142', trend: '+4.2%', isUp: true, icon: UserSquare2 },
  { label: 'Active Cohorts', value: '24', trend: '0%', isUp: true, icon: GraduationCap },
  { label: 'Upcoming Classes', value: '18', trend: '+2', isUp: true, icon: Clock },
  { label: 'Pending Reviews', value: '156', trend: '-12', isUp: false, icon: FileText },
  { label: 'Active Capstones', value: '45', trend: '+8', isUp: true, icon: Trophy },
];

const activityData = [
  { name: 'Mon', active: 4000, new: 2400 },
  { name: 'Tue', active: 3000, new: 1398 },
  { name: 'Wed', active: 2000, new: 9800 },
  { name: 'Thu', active: 2780, new: 3908 },
  { name: 'Fri', active: 1890, new: 4800 },
  { name: 'Sat', active: 2390, new: 3800 },
  { name: 'Sun', active: 3490, new: 4300 },
];

const completionData = [
  { name: 'Week 1', rate: 85 },
  { name: 'Week 2', rate: 88 },
  { name: 'Week 3', rate: 92 },
  { name: 'Week 4', rate: 95 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2">
          <FileText size={16} /> Generate Report
        </button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="glass-card rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative z-10">
              <stat.icon size={20} className="text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${stat.isUp ? 'text-accent bg-accent/10' : 'text-orange-500 bg-orange-500/10'}`}>
                  {stat.isUp ? <ArrowUpRight size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                  {stat.trend}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Student Activity</h3>
              <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50">
                <MoreVertical size={16} />
              </button>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#534ab7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#534ab7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f7a5a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0f7a5a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#534ab7" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="new" stroke="#0f7a5a" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid sm:grid-cols-2 gap-6"
          >
            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-6">Course Completion</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                    <Tooltip 
                      cursor={{ fill: 'var(--secondary)', opacity: 0.2 }}
                      contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                    />
                    <Bar dataKey="rate" fill="#534ab7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Upcoming Classes</h3>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">View All</span>
              </div>
              <div className="space-y-4 flex-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 bg-secondary/30 hover:bg-secondary/50 transition-colors rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold truncate">Advanced React.js Patterns</p>
                      <p className="text-xs text-muted-foreground truncate">Cohort A • 10:00 AM</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-6 flex flex-col"
        >
          <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
          <div className="flex-1 relative">
            <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-6 relative">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 z-10 relative">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Assignment Submitted</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sarah Jenkins submitted <span className="font-semibold text-foreground">Frontend Project 1</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">2 mins ago</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 z-10 relative">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">New Student Joined</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Michael Chang enrolled in <span className="font-semibold text-foreground">Cohort D</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">1 hour ago</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 z-10 relative">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Grade Published</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Instructor David graded <span className="font-semibold text-foreground">UI Design Test</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">3 hours ago</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 z-10 relative">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Assignment Created</p>
                  <p className="text-xs text-muted-foreground mt-0.5">New assignment added for <span className="font-semibold text-foreground">Cohort B</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">5 hours ago</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 z-10 relative">
                  <Trophy size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Capstone Project Created</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Backend API design project is now active.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
