import { 
  Megaphone, Plus, Calendar, Clock, Edit, Trash2, Users
} from 'lucide-react';

const announcements = [
  { id: 1, title: 'System Maintenance Scheduled', audience: 'All Users', date: 'Oct 25, 2026', time: '10:00 PM', status: 'Scheduled' },
  { id: 2, title: 'Welcome to Cohort B!', audience: 'Cohort B', date: 'Oct 20, 2026', time: '09:00 AM', status: 'Published' },
  { id: 3, title: 'Capstone Project Guidelines Update', audience: 'Cohort A', date: 'Oct 18, 2026', time: '02:00 PM', status: 'Published' },
];

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">Broadcast messages to specific cohorts or entire academy.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Plus size={16} /> Create Announcement
        </button>
      </div>

      <div className="grid gap-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="glass-card rounded-2xl p-5 hover:border-primary/40 transition-colors group relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Megaphone size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg">{ann.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    ann.status === 'Published' ? 'bg-accent/10 text-accent' : 'bg-orange-500/10 text-orange-500'
                  }`}>
                    {ann.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={12}/> {ann.audience}</span>
                  <span className="flex items-center gap-1"><Calendar size={12}/> {ann.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12}/> {ann.time}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 rounded-lg text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-all">
                 <Edit size={16} />
               </button>
               <button className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all">
                 <Trash2 size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
