import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, 
  Video, Clock, Users, MoreVertical
} from 'lucide-react';

export default function ClassSchedulePage() {
  const [view, setView] = useState('Week');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and view all upcoming classes across cohorts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary/30 p-1 rounded-xl border border-border">
            {['Day', 'Week', 'Month'].map((v) => (
              <button 
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={16} /> Create Class
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg border border-border hover:bg-secondary/50"><ChevronLeft size={18} /></button>
            <h2 className="text-lg font-bold">October 2026</h2>
            <button className="p-2 rounded-lg border border-border hover:bg-secondary/50"><ChevronRight size={18} /></button>
          </div>
          <button className="px-4 py-2 rounded-xl border border-border font-medium text-sm hover:bg-secondary/50">Today</button>
        </div>

        {/* Mock Calendar Grid for Week View */}
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-8 border-b border-border bg-secondary/30 divide-x divide-border">
            <div className="p-4 text-center text-xs font-semibold text-muted-foreground uppercase">Time</div>
            {['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16', 'Sat 17', 'Sun 18'].map(day => (
              <div key={day} className="p-4 text-center font-medium text-sm">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 h-[600px] divide-x divide-border relative overflow-y-auto">
            {/* Time labels column */}
            <div className="flex flex-col divide-y divide-border bg-secondary/10">
              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'].map(time => (
                <div key={time} className="h-24 p-2 text-xs text-muted-foreground text-center">{time}</div>
              ))}
            </div>
            {/* Day columns */}
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="relative flex flex-col divide-y divide-border">
                {['','','','','','','',''].map((_, i) => (
                  <div key={i} className="h-24 hover:bg-secondary/10 transition-colors"></div>
                ))}
                
                {/* Mock Event Card */}
                {day === 1 && (
                  <div className="absolute top-[20px] left-2 right-2 bg-primary/10 border border-primary/20 rounded-xl p-3 z-10 shadow-sm group">
                    <p className="text-xs font-bold text-primary mb-1 line-clamp-1">Advanced React Patterns</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10}/> 08:30 - 10:00</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Users size={10}/> Cohort A</p>
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-primary hover:text-primary/70"><MoreVertical size={14}/></button>
                    </div>
                  </div>
                )}
                {day === 3 && (
                  <div className="absolute top-[120px] left-2 right-2 bg-accent/10 border border-accent/20 rounded-xl p-3 z-10 shadow-sm">
                    <p className="text-xs font-bold text-accent mb-1 line-clamp-1">UI/UX Workshop</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10}/> 10:00 - 12:00</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Video size={10}/> Online</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
