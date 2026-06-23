import { 
  Trophy, Plus, CheckCircle2,
  UsersRound, LayoutTemplate
} from 'lucide-react';

const stats = [
  { label: 'Active Projects', value: '18', icon: Trophy, color: 'text-primary' },
  { label: 'Group Projects', value: '12', icon: UsersRound, color: 'text-blue-500' },
  { label: 'Completed Projects', value: '145', icon: CheckCircle2, color: 'text-accent' },
];

export default function CapstonePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Capstone Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage final assessment projects for cohorts.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Plus size={16} /> Create Capstone
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold mb-6">Active Projects</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-2xl p-5 hover:border-primary/40 transition-all cursor-pointer group bg-secondary/10">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Group</span>
                <span className="text-xs text-muted-foreground">Due: Nov 15</span>
              </div>
              <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">E-Commerce Microservices</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">Build a scalable e-commerce backend using Node.js, RabbitMQ, and Redis for caching.</p>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Progress</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[45%]" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border text-xs">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(idx => (
                    <div key={idx} className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-[8px] font-bold z-10">
                      S{idx}
                    </div>
                  ))}
                </div>
                <span className="text-muted-foreground font-medium flex items-center gap-1"><LayoutTemplate size={12}/> 4 Groups</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
