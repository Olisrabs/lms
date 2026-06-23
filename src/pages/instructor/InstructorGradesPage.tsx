import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, TrendingUp, Trophy } from 'lucide-react';

export default function InstructorGradesPage() {
  const [students] = useState([
    { id: 1, name: 'Sarah Jenkins', assignments: 92, tests: 88, attendance: 95, capstone: 90, final: 91 },
    { id: 2, name: 'Michael Ross', assignments: 75, tests: 82, attendance: 100, capstone: 85, final: 83 },
    { id: 3, name: 'Emma Wilson', assignments: 98, tests: 95, attendance: 90, capstone: 95, final: 95 },
    { id: 4, name: 'James Smith', assignments: 60, tests: 65, attendance: 70, capstone: 75, final: 68 },
  ]);

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-500 bg-green-500/10';
    if (score >= 80) return 'text-blue-500 bg-blue-500/10';
    if (score >= 70) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gradebook</h1>
          <p className="text-muted-foreground">Manage and export student grades.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors">
          <Download size={20} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Class Average</p>
              <p className="text-2xl font-bold">84.2%</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
              <p className="text-2xl font-bold">95.0%</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="rotate-180" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lowest Score</p>
              <p className="text-2xl font-bold">68.0%</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search students..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Frontend Cohort A</option>
            <option>Frontend Cohort B</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="p-4 font-semibold text-sm">Student Name</th>
                <th className="p-4 font-semibold text-sm">Assignments (20%)</th>
                <th className="p-4 font-semibold text-sm">Tests (20%)</th>
                <th className="p-4 font-semibold text-sm">Attendance (10%)</th>
                <th className="p-4 font-semibold text-sm">Capstone (50%)</th>
                <th className="p-4 font-semibold text-sm text-right">Final Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium">{student.assignments}%</td>
                  <td className="p-4 text-sm font-medium">{student.tests}%</td>
                  <td className="p-4 text-sm font-medium">{student.attendance}%</td>
                  <td className="p-4 text-sm font-medium">{student.capstone}%</td>
                  <td className="p-4 text-right">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold inline-block min-w-[60px] text-center ${getGradeColor(student.final)}`}>
                      {student.final}%
                    </span>
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
