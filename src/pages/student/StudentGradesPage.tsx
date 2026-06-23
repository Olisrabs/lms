import { motion } from 'framer-motion';
import { LineChart, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentGradesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Grades & Performance</h1>
          <p className="text-muted-foreground">Track your academic progress and grade breakdowns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Overall Grade', value: 'A-', sub: '92.5%', color: 'text-primary' },
          { label: 'Assignments', value: '95%', sub: 'Weight: 20%', color: 'text-blue-500' },
          { label: 'Tests & Quizzes', value: '88%', sub: 'Weight: 20%', color: 'text-orange-500' },
          { label: 'Attendance', value: '100%', sub: 'Weight: 10%', color: 'text-green-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} className="glass-card p-6 rounded-2xl border border-border">
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="lg:col-span-2 glass-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
             <h2 className="text-xl font-bold flex items-center gap-2"><LineChart size={20}/> Gradebook</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground">
                  <th className="p-4 font-semibold">Item</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Score</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-border/50">
                  <td className="p-4 font-medium">Responsive Portfolio</td>
                  <td className="p-4 text-muted-foreground">Assignment</td>
                  <td className="p-4 font-bold text-green-500">100/100</td>
                  <td className="p-4"><CheckCircle2 size={16} className="text-green-500" /></td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 font-medium">JS Fundamentals</td>
                  <td className="p-4 text-muted-foreground">Test</td>
                  <td className="p-4 font-bold text-orange-500">85/100</td>
                  <td className="p-4"><CheckCircle2 size={16} className="text-green-500" /></td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 font-medium">React Hooks Quiz</td>
                  <td className="p-4 text-muted-foreground">Quiz</td>
                  <td className="p-4 font-bold text-muted-foreground">Pending</td>
                  <td className="p-4"><AlertCircle size={16} className="text-orange-500" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-6">Grade Breakdown</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-blue-500">Assignments (20%)</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width: '20%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-orange-500">Tests (20%)</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{width: '20%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-green-500">Attendance (10%)</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width: '10%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-purple-500">Capstone Project (50%)</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{width: '50%'}}></div></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
