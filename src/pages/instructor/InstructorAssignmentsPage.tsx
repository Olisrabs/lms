import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, XCircle, Clock, ExternalLink, FileText } from 'lucide-react';

export default function InstructorAssignmentsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);

  const submissions = [
    { id: 1, student: 'Sarah Jenkins', task: 'React Portfolio', status: 'pending', date: 'Today, 10:30 AM', link: 'https://github.com/sarah/portfolio' },
    { id: 2, student: 'Michael Ross', task: 'State Management', status: 'pending', date: 'Today, 09:15 AM', link: 'https://github.com/mike/state-app' },
    { id: 3, student: 'Emma Wilson', task: 'React Portfolio', status: 'graded', date: 'Yesterday', score: 95 },
  ];

  const filtered = submissions.filter(s => 
    activeTab === 'pending' ? s.status === 'pending' : s.status === 'graded'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignment Submissions</h1>
          <p className="text-muted-foreground">Review and grade student assignments.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-2 border border-border flex gap-2">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'pending' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}
            >
              Needs Review
            </button>
            <button 
              onClick={() => setActiveTab('graded')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'graded' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}
            >
              Graded
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input type="text" placeholder="Search students..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="divide-y divide-border h-[500px] overflow-y-auto">
              {filtered.map((sub) => (
                <div 
                  key={sub.id} 
                  onClick={() => setSelectedSubmission(sub.id)}
                  className={`p-4 cursor-pointer transition-colors ${selectedSubmission === sub.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-secondary/30 border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm">{sub.student}</p>
                    <span className="text-xs text-muted-foreground">{sub.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{sub.task}</p>
                  {sub.status === 'graded' && (
                    <div className="mt-2 text-xs font-bold text-green-500">Score: {sub.score}/100</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:w-2/3">
          <AnimatePresence mode="wait">
            {selectedSubmission ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-2xl border border-border p-6 h-full"
              >
                {/* Find the selected submission */}
                {submissions.filter(s => s.id === selectedSubmission).map(sub => (
                  <div key={sub.id} className="h-full flex flex-col">
                    <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{sub.student}</h2>
                        <p className="text-muted-foreground">{sub.task}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm bg-secondary px-3 py-1 rounded-lg">
                        <Clock size={16} /> Submitted: {sub.date}
                      </span>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Submission Link</h3>
                        <a href={sub.link} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border hover:border-primary/50 transition-colors group">
                          <span className="font-medium">{sub.link}</span>
                          <ExternalLink size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      </div>

                      {sub.status === 'pending' && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Grading & Feedback</h3>
                          <div>
                            <label className="block text-sm font-medium mb-2">Score (0-100)</label>
                            <input type="number" max="100" min="0" className="w-32 bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Instructor Feedback</label>
                            <textarea rows={5} placeholder="Provide constructive feedback..." className="w-full bg-background border border-border rounded-xl p-4 focus:ring-2 focus:ring-primary/20 outline-none resize-none"></textarea>
                          </div>
                        </div>
                      )}
                    </div>

                    {sub.status === 'pending' && (
                      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                        <button className="px-6 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2">
                          <XCircle size={18} /> Request Revision
                        </button>
                        <button className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                          <CheckCircle2 size={18} /> Publish Grade
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="glass-card rounded-2xl border border-border p-6 h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a submission</p>
                <p className="text-sm">Click on a student's submission from the list to start grading.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
