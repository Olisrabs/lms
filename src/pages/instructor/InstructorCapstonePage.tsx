import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, CheckCircle2, Search } from 'lucide-react';

export default function InstructorCapstonePage() {
  const [projects] = useState([
    { id: 1, title: 'LMS Platform Revamp', student: 'Sarah Jenkins', cohort: 'Frontend A', status: 'Pending Review', score: null },
    { id: 2, title: 'E-Commerce Backend API', student: 'Michael Ross', cohort: 'Backend B', status: 'Graded', score: 92 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Capstone Projects</h1>
          <p className="text-muted-foreground">Review and grade final capstone project submissions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={20} /> New Capstone Brief
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search projects..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>All Statuses</option>
            <option>Pending Review</option>
            <option>Graded</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="p-4 font-semibold text-sm">Project Title</th>
                <th className="p-4 font-semibold text-sm">Student</th>
                <th className="p-4 font-semibold text-sm">Cohort</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm text-right">Score</th>
                <th className="p-4 font-semibold text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr key={proj.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                  <td className="p-4 font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-primary" /> {proj.title}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium">{proj.student}</td>
                  <td className="p-4 text-sm text-muted-foreground">{proj.cohort}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${proj.status === 'Graded' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {proj.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold">
                    {proj.score ? `${proj.score}%` : '-'}
                  </td>
                  <td className="p-4 text-right">
                    {proj.status === 'Pending Review' ? (
                      <button className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
                        Review
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-1 ml-auto">
                        <CheckCircle2 size={14} /> View
                      </button>
                    )}
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
