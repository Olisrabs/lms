import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Video, Plus } from 'lucide-react';

const schedule = [
  { id: 1, title: 'Advanced React Patterns', instructor: 'Sarah Drasner', date: 'Today, Oct 24', time: '10:00 AM - 11:30 AM', status: 'upcoming' },
  { id: 2, title: 'State Management with Redux', instructor: 'Dan Abramov', date: 'Tomorrow, Oct 25', time: '02:00 PM - 04:00 PM', status: 'upcoming' },
  { id: 3, title: 'Next.js Fundamentals', instructor: 'Lee Robinson', date: 'Thu, Oct 26', time: '10:00 AM - 12:00 PM', status: 'upcoming' },
];

export default function StudentSchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground">View your upcoming live classes and sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedule.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl border border-border p-6 relative overflow-hidden"
          >
            {i === 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-accent"></div>}
            
            <div className="mb-4">
              {i === 0 && <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded mb-2 uppercase tracking-wide">Up Next</span>}
              <h3 className="text-xl font-bold leading-tight mb-1">{session.title}</h3>
              <p className="text-sm text-muted-foreground">with {session.instructor}</p>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon size={16} className="text-primary"/> {session.date}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock size={16} className="text-primary"/> {session.time}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${i === 0 ? 'bg-accent text-white hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                <Video size={16} /> Join Class
              </button>
              <button className="p-2.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl transition-colors" title="Add to Calendar">
                <Plus size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
