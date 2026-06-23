import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Edit, 
  Trash2, Archive, BookOpen, Users, GraduationCap, X
} from 'lucide-react';

const programsData = [
  { id: 1, name: 'Frontend Engineering', students: 450, instructors: 12, cohorts: 8, status: 'Active' },
  { id: 2, name: 'Backend Development', students: 380, instructors: 10, cohorts: 6, status: 'Active' },
  { id: 3, name: 'UI/UX Design', students: 290, instructors: 8, cohorts: 5, status: 'Active' },
  { id: 4, name: 'Data Science', students: 150, instructors: 5, cohorts: 3, status: 'Archived' },
];

export default function ProgramsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all learning programs in the academy.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Create Program
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search programs..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors shrink-0">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-secondary/30">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Program Name</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Instructors</th>
                <th className="px-4 py-3 font-medium">Cohorts</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {programsData.map((program) => (
                <tr key={program.id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <span className="font-semibold">{program.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users size={14} /> {program.students}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users size={14} /> {program.instructors}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap size={14} /> {program.cohorts}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      program.status === 'Active' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {program.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 rounded-lg text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-all">
                        <Archive size={16} />
                      </button>
                      <button className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
          <span>Showing 1 to 4 of 4 entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-50">Previous</button>
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  <h3 className="text-xl font-bold">Create Program</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Program Name</label>
                    <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="e.g. Full Stack Engineering" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <textarea rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" placeholder="Brief description of the program..."></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Duration (Weeks)</label>
                      <input type="number" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="e.g. 12" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                      <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                      Cancel
                    </button>
                    <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                      Save Program
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
