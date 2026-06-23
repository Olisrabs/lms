import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Video, Users, MoreVertical } from 'lucide-react';

export default function InstructorSchedulePage() {
  const schedule = [
    { id: 1, title: 'React Hooks Deep Dive', cohort: 'Frontend A', date: 'Today', time: '10:00 AM - 12:00 PM', type: 'Live Class', status: 'upcoming' },
    { id: 2, title: 'UI/UX Fundamentals', cohort: 'Design B', date: 'Today', time: '02:00 PM - 04:00 PM', type: 'Live Class', status: 'upcoming' },
    { id: 3, title: 'Weekly Q&A Mentorship', cohort: 'All Cohorts', date: 'Tomorrow', time: '11:00 AM - 12:30 PM', type: 'Mentorship', status: 'scheduled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground">Manage your upcoming live classes and mentorship sessions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <CalendarIcon size={20} /> Schedule Class
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {schedule.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Video size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{session.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users size={14} /> {session.cohort}</span>
                    <span className="flex items-center gap-1"><CalendarIcon size={14} /> {session.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {session.time}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                  Start Session
                </button>
                <button className="p-2.5 bg-secondary/50 hover:bg-secondary rounded-xl transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-border p-6">
            <h3 className="font-bold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Classes This Week</p>
                <p className="text-2xl font-bold text-primary">8</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Teaching Hours</p>
                <p className="text-2xl font-bold">14.5h</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
