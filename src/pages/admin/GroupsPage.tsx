
import { 
  UsersRound, Plus, MoreVertical, MessageSquare
} from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Group Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize students into groups for capstone and projects.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-all border border-border flex items-center gap-2">
            Auto Assign
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={16} /> Create Group
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 relative group cursor-pointer hover:border-primary/40 transition-colors">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-muted-foreground hover:text-primary"><MoreVertical size={16} /></button>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UsersRound size={20} />
              </div>
              <div>
                <h3 className="font-bold">Group {String.fromCharCode(64 + i)}</h3>
                <p className="text-xs text-muted-foreground">Cohort A</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Project</p>
              <p className="text-sm font-semibold bg-secondary/30 p-2 rounded-lg border border-border inline-block">E-Commerce API</p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Members (4)</p>
              <div className="flex flex-col gap-2">
                {['Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Ross'].map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-card border border-border rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{member[0]}</div>
                      <span>{member}</span>
                    </div>
                    {idx === 0 && <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">LEAD</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
               <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-md">Active</span>
               <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium">
                 <MessageSquare size={14}/> Message Group
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
