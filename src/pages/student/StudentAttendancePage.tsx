import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function StudentAttendancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Monitor your class attendance and history.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Attendance', value: '96%', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Present', value: '24', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Absent', value: '1', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Late', value: '0', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}} className="glass-card p-4 rounded-2xl border border-border flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
               <stat.icon size={24} />
             </div>
             <div>
               <p className="text-2xl font-bold">{stat.value}</p>
               <p className="text-xs text-muted-foreground uppercase font-medium">{stat.label}</p>
             </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Class</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { date: 'Oct 23, 2026', class: 'Advanced React Patterns', status: 'Present', color: 'text-green-500 bg-green-500/10' },
                { date: 'Oct 22, 2026', class: 'State Management with Redux', status: 'Present', color: 'text-green-500 bg-green-500/10' },
                { date: 'Oct 20, 2026', class: 'React Hooks Deep Dive', status: 'Absent', color: 'text-red-500 bg-red-500/10' },
                { date: 'Oct 19, 2026', class: 'Component Composition', status: 'Present', color: 'text-green-500 bg-green-500/10' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="p-4 font-medium">{row.date}</td>
                  <td className="p-4 text-muted-foreground">{row.class}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.color}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
