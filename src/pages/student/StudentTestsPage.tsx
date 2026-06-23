import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertCircle, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const tests = [
  { id: 1, title: 'JavaScript Fundamentals Midterm', questions: 40, timeLimit: '60 mins', dueDate: 'Tomorrow, 11:59 PM', status: 'available' },
  { id: 2, title: 'React Hooks Quiz', questions: 15, timeLimit: '20 mins', dueDate: 'Oct 28', status: 'available' },
  { id: 3, title: 'HTML & CSS Basics', questions: 25, timeLimit: '45 mins', dueDate: 'Past', status: 'completed' },
];

export default function StudentTestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tests & Quizzes</h1>
          <p className="text-muted-foreground">Take tests and view upcoming quizzes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test, i) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card rounded-2xl p-6 border ${test.status === 'completed' ? 'border-green-500/30' : 'border-border'} flex flex-col h-full`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CheckSquare size={20} />
              </div>
              {test.status === 'completed' && <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Completed</span>}
              {test.status === 'available' && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Available Now</span>}
            </div>
            
            <h3 className="text-xl font-bold mb-2">{test.title}</h3>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <span>{test.questions} Questions</span>
              <span>•</span>
              <span>{test.timeLimit}</span>
            </div>

            <div className="mt-auto pt-4 border-t border-border">
              {test.status === 'completed' ? (
                <div className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-secondary/50 text-muted-foreground cursor-not-allowed">
                  Completed
                </div>
              ) : (
                <Link to={`/student/tests/${test.id}`} className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors bg-primary text-primary-foreground hover:bg-primary/90`}>
                  <PlayCircle size={18}/> Start Test
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
