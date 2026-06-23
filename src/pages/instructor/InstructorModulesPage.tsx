import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Plus, MoreVertical, Edit, FileText, Video } from 'lucide-react';

export default function InstructorModulesPage() {
  const [modules] = useState([
    { id: 1, title: 'Introduction to React', lessons: 5, duration: '2h 30m', status: 'Published' },
    { id: 2, title: 'Component State & Lifecycle', lessons: 4, duration: '1h 45m', status: 'Published' },
    { id: 3, title: 'Hooks Deep Dive', lessons: 8, duration: '4h 00m', status: 'Draft' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Modules & Lessons</h1>
          <p className="text-muted-foreground">Manage course content, modules, and individual lessons.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={20} /> Create Module
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border p-4 flex gap-4 overflow-x-auto text-sm font-medium">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input type="text" placeholder="Search modules..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>All Courses</option>
          <option>React Fundamentals</option>
          <option>Advanced State Management</option>
        </select>
      </div>

      <div className="space-y-4">
        {modules.map((mod, i) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{mod.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText size={14}/> {mod.lessons} Lessons</span>
                  <span className="flex items-center gap-1"><Video size={14}/> {mod.duration}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${mod.status === 'Published' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {mod.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-xl text-sm font-medium transition-colors">
                <Edit size={16} /> Edit
              </button>
              <button className="p-2 bg-secondary/50 hover:bg-secondary rounded-xl transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
