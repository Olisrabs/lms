import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckSquare, Search, Eye, Edit, BarChart } from 'lucide-react';

export default function InstructorTestsPage() {
  const [tests] = useState([
    { id: 1, title: 'React Core Assessment', cohort: 'Frontend A', questions: 25, duration: '45 mins', status: 'Active', submissions: 32 },
    { id: 2, title: 'State Management Quiz', cohort: 'Frontend A', questions: 10, duration: '15 mins', status: 'Draft', submissions: 0 },
    { id: 3, title: 'CSS Layouts Midterm', cohort: 'Frontend B', questions: 40, duration: '90 mins', status: 'Completed', submissions: 45 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tests & Quizzes</h1>
          <p className="text-muted-foreground">Manage your assessments and review student results.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
          <Plus size={20} /> Create Test
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border p-4 flex gap-4 overflow-x-auto text-sm font-medium">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input type="text" placeholder="Search tests..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>All Cohorts</option>
          <option>Frontend A</option>
          <option>Frontend B</option>
        </select>
        <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Draft</option>
          <option>Completed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test, i) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl border border-border overflow-hidden flex flex-col"
          >
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CheckSquare size={24} />
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                  test.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                  test.status === 'Draft' ? 'bg-orange-500/10 text-orange-500' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {test.status}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">{test.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{test.cohort}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                  <p className="text-muted-foreground mb-1">Questions</p>
                  <p className="font-bold">{test.questions}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                  <p className="text-muted-foreground mb-1">Duration</p>
                  <p className="font-bold">{test.duration}</p>
                </div>
              </div>
              
              {test.status !== 'Draft' && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 mb-2">
                  <span className="text-sm font-medium">Submissions</span>
                  <span className="font-bold text-primary">{test.submissions}</span>
                </div>
              )}
            </div>

            <div className="mt-auto grid grid-cols-3 divide-x divide-border border-t border-border bg-secondary/10">
              <button className="py-3 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors">
                <Edit size={16} /> Edit
              </button>
              <button className="py-3 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors">
                <Eye size={16} /> Preview
              </button>
              <button className="py-3 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors disabled:opacity-50" disabled={test.status === 'Draft'}>
                <BarChart size={16} /> Results
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
