import { motion } from 'framer-motion';
import { Video, Calendar } from 'lucide-react';

const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const scheduleData: Record<string, Record<string, { title: string, instructor: string }>> = {
  'Monday': {
    '10:00 AM': { title: 'Advanced React', instructor: 'Sarah D.' }
  },
  'Tuesday': {
    '02:00 PM': { title: 'UI/UX Basics', instructor: 'Michael R.' }
  },
  'Wednesday': {
    '09:00 AM': { title: 'Backend APIs', instructor: 'David S.' },
    '01:00 PM': { title: 'React Hooks', instructor: 'Sarah D.' }
  },
  'Thursday': {
    '11:00 AM': { title: 'State Management', instructor: 'Dan A.' }
  },
  'Friday': {
    '10:00 AM': { title: 'Career Prep', instructor: 'Emma W.' }
  }
};

export default function StudentTimetablePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Timetable</h1>
          <p className="text-muted-foreground">View your weekly class schedule and join live sessions.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-4 font-semibold text-sm text-muted-foreground w-24 border-r border-border"><Calendar size={18}/></th>
                {days.map(day => (
                  <th key={day} className="p-4 font-semibold text-sm text-center text-foreground border-r border-border last:border-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} className="border-b border-border/50 group">
                  <td className="p-4 text-xs font-bold text-muted-foreground border-r border-border bg-secondary/10 whitespace-nowrap">
                    {time}
                  </td>
                  {days.map(day => {
                    const session = scheduleData[day]?.[time];
                    return (
                      <td key={`${day}-${time}`} className="p-2 border-r border-border last:border-0 h-24 align-top w-[calc(100%/5)] hover:bg-secondary/10 transition-colors">
                        {session ? (
                          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 h-full flex flex-col justify-between group-hover:shadow-md transition-shadow">
                            <div>
                              <p className="font-bold text-sm text-primary leading-tight mb-1">{session.title}</p>
                              <p className="text-xs text-muted-foreground">{session.instructor}</p>
                            </div>
                            <button className="w-full mt-2 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors">
                              <Video size={12}/> Join
                            </button>
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
