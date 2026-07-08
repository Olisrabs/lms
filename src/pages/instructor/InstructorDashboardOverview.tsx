import { motion } from 'framer-motion';
import {  
  FileText, CheckSquare, Trophy
} from 'lucide-react';

export default function InstructorDashboardOverview() {
  const stats = [
    { label: 'Total Students', value: '38', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Pending Test Reviews', value: '15', icon: CheckSquare, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Active Projects', value: '8', icon: Trophy, color: 'text-green-500', bg: 'bg-green-500/10' }
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, Dr. Robert</h1>
          <p className="text-muted-foreground mt-1">Here is what's happening with your cohorts today.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-4 border border-border flex flex-col justify-between"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Performance Overview</h2>
              <button className="text-sm text-primary hover:underline">View All Metrics</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Avg. Attendance Rate</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold">92%</span>
                  <span className="text-sm font-medium text-green-500">+2.5% this month</span>
                </div>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Assignment Completion</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold">85%</span>
                  <span className="text-sm font-medium text-red-500">-1.2% this week</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { title: 'Sarah Jenkins submitted Assignment 3', time: '10 mins ago', type: 'submission' },
                { title: 'Michael Ross completed React Quiz', time: '1 hour ago', type: 'test' },
                { title: 'Cohort B joined the live class', time: '2 hours ago', type: 'class' },
                { title: 'New Capstone submission received', time: '5 hours ago', type: 'project' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0 relative">
                    {i !== 3 && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-border"></div>}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 bg-secondary text-foreground text-sm font-bold rounded-xl hover:bg-secondary/80 transition-colors">
              View All Activity
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
