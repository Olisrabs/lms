import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

export default function InstructorTimetablePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'];

  const scheduleMap: Record<string, any> = {
    'Monday-09:00 AM': { course: 'React Basics', cohort: 'Cohort A', type: 'Lecture' },
    'Tuesday-01:00 PM': { course: 'State Management', cohort: 'Cohort B', type: 'Lab' },
    'Wednesday-11:00 AM': { course: 'API Integration', cohort: 'Cohort A', type: 'Lecture' },
    'Thursday-03:00 PM': { course: 'Mentorship Session', cohort: 'All', type: '1-on-1' },
    'Friday-09:00 AM': { course: 'Capstone Review', cohort: 'Cohort C', type: 'Review' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Timetable Builder</h1>
          <p className="text-muted-foreground">Visually plan and manage your weekly classes.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors">
          <CalendarIcon size={20} /> Add Time Slot
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="p-4 w-24 border-r border-border text-muted-foreground"><Clock size={18} /></th>
                {days.map(day => (
                  <th key={day} className="p-4 text-center font-bold border-r border-border last:border-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map(time => (
                <tr key={time} className="border-b border-border/50 group">
                  <td className="p-4 text-xs font-bold text-muted-foreground border-r border-border bg-secondary/10 whitespace-nowrap">
                    {time}
                  </td>
                  {days.map(day => {
                    const session = scheduleMap[`${day}-${time}`];
                    return (
                      <td key={`${day}-${time}`} className="p-2 border-r border-border last:border-0 h-28 align-top hover:bg-secondary/10 transition-colors cursor-pointer w-[18%]">
                        {session ? (
                          <div className="h-full bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow group/card relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                            <div>
                              <p className="text-sm font-bold text-primary mb-1 leading-tight">{session.course}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users size={12} /> {session.cohort}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-background/50 text-foreground w-fit px-2 py-0.5 rounded-md mt-2">
                              {session.type}
                            </span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
