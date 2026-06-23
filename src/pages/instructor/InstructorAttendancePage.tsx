import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Check, X, Clock, AlertCircle } from 'lucide-react';

export default function InstructorAttendancePage() {
  const [date] = useState('Today, 10:00 AM');
  const [students] = useState([
    { id: 1, name: 'Sarah Jenkins', status: 'present' },
    { id: 2, name: 'Michael Ross', status: 'late' },
    { id: 3, name: 'Emma Wilson', status: 'present' },
    { id: 4, name: 'James Smith', status: 'absent' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Mark and review attendance for your classes.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border">
          <Calendar size={18} className="text-muted-foreground" />
          <span className="font-bold text-sm">{date}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: '45', color: 'text-foreground' },
          { label: 'Present', value: '40', color: 'text-green-500' },
          { label: 'Absent', value: '3', color: 'text-red-500' },
          { label: 'Late', value: '2', color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl border border-border p-4 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search students..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Frontend Cohort A</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="p-4 font-semibold text-sm">Student</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
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
                  <td className="p-4">
                    <span className={`px-3 py-1 inline-flex items-center gap-1 rounded-lg text-xs font-bold capitalize ${
                      student.status === 'present' ? 'bg-green-500/10 text-green-500' :
                      student.status === 'late' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {student.status === 'present' && <Check size={14}/>}
                      {student.status === 'late' && <Clock size={14}/>}
                      {student.status === 'absent' && <X size={14}/>}
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"><Check size={16}/></button>
                      <button className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"><X size={16}/></button>
                      <button className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors"><Clock size={16}/></button>
                      <button className="p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"><AlertCircle size={16}/></button>
                    </div>
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
