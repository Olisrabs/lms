import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Video, Plus, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockDb } from '../../lib/mockDb';

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timetable = mockDb.getTimetable();
    const flatList: any[] = [];
    let id = 1;
    Object.entries(timetable).forEach(([day, slots]: [string, any]) => {
      Object.entries(slots).forEach(([time, details]: [string, any]) => {
        flatList.push({
          id: id++,
          title: details.title,
          instructor: details.instructor,
          date: `${day}, Weekly`,
          time: `${time} - ${time.replace('00', '30').replace(' AM', ':30 AM').replace(' PM', ':30 PM')}`,
          meetingUrl: 'https://meet.google.com/new',
          status: 'upcoming',
        });
      });
    });
    setSchedule(flatList);
  }, []);

  const handleJoinClass = (session: any) => {
    if (session.meetingUrl) {
      window.open(session.meetingUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/student/classes');
    }
  };

  const handleAddToCalendar = (session: any) => {
    const now = new Date();
    const startTimeStr = now.toISOString().replace(/-|:|\.\d+/g, '');
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTimeStr = endTime.toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Make It Simple//LMS Schedule//EN',
      'BEGIN:VEVENT',
      `UID:${session.id}-${Date.now()}@makeitsimple.edu`,
      `DTSTAMP:${startTimeStr}`,
      `DTSTART:${startTimeStr}`,
      `DTEND:${endTimeStr}`,
      `SUMMARY:${session.title}`,
      `DESCRIPTION:Live class session with ${session.instructor}`,
      `LOCATION:Make It Simple Online Classroom`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCalendarToast(session.title);
    setTimeout(() => setCalendarToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {calendarToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl bg-green-500/15 border border-green-500/30 text-green-500 flex items-center gap-2 text-sm font-semibold backdrop-blur-md"
          >
            <CheckCircle2 size={18} />
            <span>Added "{calendarToast}" to your calendar (.ics downloaded)!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-1">View your weekly live sessions and join upcoming classes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedule.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl border border-border p-6 relative overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all"
          >
            {i === 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />}

            <div>
              <div className="mb-4">
                {i === 0 && (
                  <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded mb-2 uppercase tracking-wide">
                    Up Next
                  </span>
                )}
                <h3 className="text-xl font-bold leading-tight mb-1">{session.title}</h3>
                <p className="text-sm text-muted-foreground">with {session.instructor}</p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarIcon size={16} className="text-primary" /> {session.date}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock size={16} className="text-primary" /> {session.time}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleJoinClass(session)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  i === 0 ? 'bg-accent text-white hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                <Video size={16} /> Join Class
              </button>
              <button
                onClick={() => handleAddToCalendar(session)}
                className="p-2.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
                title="Add to Calendar (.ics download)"
              >
                <Plus size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
