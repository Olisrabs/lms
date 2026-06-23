import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Search, Send } from 'lucide-react';

export default function InstructorAnnouncementsPage() {
  const [announcements] = useState([
    { id: 1, title: 'Final Project Guidelines', cohort: 'All Cohorts', date: 'Today, 09:00 AM', status: 'Published' },
    { id: 2, title: 'No class this Friday', cohort: 'Frontend A', date: 'Yesterday', status: 'Published' },
    { id: 3, title: 'Midterm Exam Results', cohort: 'Backend B', date: '2 days ago', status: 'Draft' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Broadcast messages and updates to your cohorts.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={20} /> New Announcement
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input type="text" placeholder="Search announcements..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="divide-y divide-border h-[400px] overflow-y-auto">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors border-l-4 border-l-transparent hover:border-l-primary">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm line-clamp-1">{ann.title}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{ann.date}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{ann.cohort}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${ann.status === 'Published' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                      {ann.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-2/3">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl border border-border p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Megaphone size={20} className="text-primary"/> Compose Announcement</h2>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Title</label>
                <input type="text" placeholder="e.g. Important update regarding next week's schedule" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Target Cohort</label>
                <select className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none">
                  <option>All Cohorts</option>
                  <option>Frontend A</option>
                  <option>Backend B</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Message</label>
                <textarea rows={8} placeholder="Type your announcement here..." className="w-full bg-secondary/30 border border-border rounded-xl p-4 focus:ring-2 focus:ring-primary/20 outline-none resize-none"></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <button className="px-6 py-2.5 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors">
                Save Draft
              </button>
              <button className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                <Send size={18} /> Publish Now
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
