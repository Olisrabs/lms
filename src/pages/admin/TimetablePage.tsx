import { Zap, AlertTriangle } from 'lucide-react';

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timetable Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Visually plan and generate recurring schedules.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Zap size={16} /> Auto Generate
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Target Cohort</label>
                <select className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 appearance-none">
                  <option>Cohort A</option>
                  <option>Cohort B</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Semester/Term</label>
                <select className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 appearance-none">
                  <option>Term 1 (2026)</option>
                  <option>Term 2 (2026)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" /> Conflicts (1)
            </h3>
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-500">
              <span className="font-bold">Instructor David</span> is double booked on Mon 10:00 AM.
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 glass-card rounded-3xl p-6">
          <div className="overflow-x-auto">
             <div className="min-w-[700px] border border-border rounded-2xl overflow-hidden grid grid-cols-7 divide-x divide-border bg-card">
               <div className="p-3 text-center bg-secondary/30 font-semibold text-muted-foreground text-xs">Time</div>
               {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className="p-3 text-center bg-secondary/30 font-semibold text-sm">{d}</div>
               ))}
               
               {/* 8 AM Row */}
               <div className="h-16 flex items-center justify-center text-xs text-muted-foreground border-t border-border">08:00 AM</div>
               <div className="h-16 border-t border-border p-1">
                 <div className="h-full w-full bg-primary/10 border border-primary/20 rounded-lg p-1.5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-primary leading-tight">React.js</p>
                    <p className="text-[9px] text-muted-foreground">Sarah J.</p>
                 </div>
               </div>
               <div className="h-16 border-t border-border"></div>
               <div className="h-16 border-t border-border"></div>
               <div className="h-16 border-t border-border p-1">
                 <div className="h-full w-full bg-accent/10 border border-accent/20 rounded-lg p-1.5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-accent leading-tight">UI/UX</p>
                    <p className="text-[9px] text-muted-foreground">Michael R.</p>
                 </div>
               </div>
               <div className="h-16 border-t border-border"></div>
               <div className="h-16 border-t border-border"></div>

               {/* 10 AM Row */}
               <div className="h-16 flex items-center justify-center text-xs text-muted-foreground border-t border-border bg-secondary/10">10:00 AM</div>
               <div className="h-16 border-t border-border bg-secondary/10"></div>
               <div className="h-16 border-t border-border p-1 bg-orange-500/5">
                 <div className="h-full w-full bg-orange-500/10 border border-orange-500/50 rounded-lg p-1.5 flex flex-col justify-center relative shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                    <AlertTriangle size={10} className="absolute top-1 right-1 text-orange-500"/>
                    <p className="text-[10px] font-bold text-orange-500 leading-tight">Backend</p>
                    <p className="text-[9px] text-orange-500/70">David S.</p>
                 </div>
               </div>
               <div className="h-16 border-t border-border bg-secondary/10"></div>
               <div className="h-16 border-t border-border bg-secondary/10"></div>
               <div className="h-16 border-t border-border bg-secondary/10"></div>
               <div className="h-16 border-t border-border bg-secondary/10"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
