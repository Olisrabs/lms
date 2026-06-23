import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';

export default function InstructorPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Performance</h1>
        <p className="text-muted-foreground">Analytics and early warning indicators for your cohorts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Class Grade', value: '84%', trend: '+2%', icon: TrendingUp, color: 'text-green-500' },
          { label: 'Completion Rate', value: '92%', trend: '+5%', icon: Users, color: 'text-blue-500' },
          { label: 'At-Risk Students', value: '3', trend: '-1', icon: AlertCircle, color: 'text-red-500' },
          { label: 'Avg Attendance', value: '88%', trend: '-2%', icon: TrendingDown, color: 'text-orange-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-sm font-bold ${stat.color}`}>{stat.trend}</span>
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">Top Performers</h2>
          <div className="space-y-3">
            {['Sarah Jenkins', 'Emma Wilson', 'David Chen'].map((name, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm">{name}</span>
                </div>
                <span className="text-sm font-bold text-green-500">95%+</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2"><AlertCircle size={20}/> Early Warnings</h2>
          <div className="space-y-3">
            {[
              { name: 'James Smith', issue: 'Missed last 3 classes' },
              { name: 'Michael Ross', issue: 'Failing test scores (< 60%)' },
            ].map((student, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                <div>
                  <p className="font-bold text-sm">{student.name}</p>
                  <p className="text-xs text-red-500">{student.issue}</p>
                </div>
                <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">
                  Contact
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
