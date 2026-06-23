import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Upload, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

const initialAssignments = [
  {
    id: 1,
    title: 'Build a Responsive Portfolio',
    course: 'HTML & CSS Fundamentals',
    dueDate: 'Today, 11:59 PM',
    status: 'pending',
  },
  {
    id: 2,
    title: 'JavaScript Array Methods Exercises',
    course: 'JavaScript Essentials',
    dueDate: 'Tomorrow, 11:59 PM',
    status: 'pending',
  }
];

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [activeSubmission, setActiveSubmission] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    setAssignments(assignments.map(a => a.id === id ? { ...a, status: 'submitted' } : a));
    setActiveSubmission(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">View and submit your recent assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((assignment, index) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-2xl border border-border flex flex-col h-full overflow-hidden"
          >
            <div className="p-6 pb-0 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                  assignment.status === 'pending' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-green-500/10 text-green-600 dark:text-green-400'
                }`}>
                  {assignment.status === 'pending' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                  <span className="capitalize">{assignment.status}</span>
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-1">{assignment.title}</h3>
              <p className="text-sm text-muted-foreground">{assignment.course}</p>
            </div>
            
            <div className="mt-auto border-t border-border bg-secondary/10">
              <AnimatePresence mode="wait">
                {activeSubmission === assignment.id ? (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6"
                    onSubmit={(e) => handleSubmit(e, assignment.id)}
                  >
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Submission URL</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16}/>
                          <input type="url" placeholder="https://..." required className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Notes (Optional)</label>
                        <textarea rows={2} placeholder="Add any comments..." className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"></textarea>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setActiveSubmission(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        Confirm Submit
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6"
                  >
                    <p className="text-sm font-medium flex items-center gap-2 mb-4">
                      <Clock size={16} className="text-muted-foreground"/> 
                      <span className="text-muted-foreground">Deadline:</span> {assignment.dueDate}
                    </p>
                    
                    <button 
                      onClick={() => setActiveSubmission(assignment.id)}
                      disabled={assignment.status === 'submitted'}
                      className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        assignment.status === 'submitted'
                          ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20'
                      }`}
                    >
                      {assignment.status === 'submitted' ? (
                        <>Submitted <CheckCircle2 size={18} /></>
                      ) : (
                        <>Submit Assignment <Upload size={18} /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
