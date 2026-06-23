import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, MoreVertical, 
  Users, GraduationCap, Calendar, X
} from 'lucide-react';

const cohortsData = [
  { id: 1, name: 'Cohort A', program: 'Frontend Engineering', start: 'Jan 15, 2026', end: 'Apr 15, 2026', students: 45, instructors: 2, progress: 75 },
  { id: 2, name: 'Cohort B', program: 'Backend Development', start: 'Feb 01, 2026', end: 'May 01, 2026', students: 38, instructors: 2, progress: 40 },
  { id: 3, name: 'Cohort C', program: 'UI/UX Design', start: 'Mar 10, 2026', end: 'Jun 10, 2026', students: 25, instructors: 1, progress: 10 },
];

export default function CohortsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cohorts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and organize student groups and batches.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Create Cohort
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input 
            type="text" 
            placeholder="Search cohorts..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors shrink-0">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cohortsData.map((cohort) => (
          <div key={cohort.id} className="glass-card rounded-3xl p-6 flex flex-col group hover:border-primary/40 transition-colors cursor-pointer relative overflow-hidden">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users size={24} />
              </div>
              <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
            
            <div className="relative z-10 flex-1">
              <h3 className="text-xl font-bold">{cohort.name}</h3>
              <p className="text-sm text-primary font-medium mt-1">{cohort.program}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar size={12}/> Start Date</p>
                  <p className="text-sm font-medium">{cohort.start}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar size={12}/> End Date</p>
                  <p className="text-sm font-medium">{cohort.end}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-muted-foreground"/> 
                  <span className="font-semibold">{cohort.students}</span> <span className="text-muted-foreground text-xs">Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap size={16} className="text-muted-foreground"/> 
                  <span className="font-semibold">{cohort.instructors}</span> <span className="text-muted-foreground text-xs">Instructors</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground font-medium">Progress</span>
                  <span className="font-bold text-accent">{cohort.progress}%</span>
                </div>
                <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${cohort.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl my-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Create Cohort</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Cohort Name</label>
                    <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="e.g. Cohort A 2026" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Program</label>
                    <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                      <option>Frontend Engineering</option>
                      <option>Backend Development</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                      <input type="date" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                      <input type="date" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Assign Instructors</label>
                    <select multiple className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                      <option>David Smith</option>
                      <option>Sarah Jenkins</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">Hold CTRL/CMD to select multiple</p>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                      Cancel
                    </button>
                    <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                      Create Cohort
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
