import { 
  Download, FileText, FileSpreadsheet,
  TrendingUp, Users, GraduationCap, CheckCircle2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const growthData = [
  { month: 'Jan', students: 1000 },
  { month: 'Feb', students: 1200 },
  { month: 'Mar', students: 1500 },
  { month: 'Apr', students: 2200 },
  { month: 'May', students: 2800 },
  { month: 'Jun', students: 3500 },
  { month: 'Jul', students: 4521 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep dive into academy performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all flex items-center gap-2">
            <FileText size={16} className="text-red-500" /> PDF
          </button>
          <button className="px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-accent" /> Excel
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Enrollment Growth', val: '+45%', desc: 'vs last term', icon: TrendingUp, color: 'text-primary' },
          { title: 'Student Retention', val: '94%', desc: 'overall rate', icon: Users, color: 'text-accent' },
          { title: 'Avg Course Rating', val: '4.8/5', desc: 'from surveys', icon: CheckCircle2, color: 'text-amber-500' },
          { title: 'Graduation Rate', val: '88%', desc: 'eligible students', icon: GraduationCap, color: 'text-purple-500' },
        ].map((item, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 border-t-4 border-t-border hover:border-t-primary transition-all">
             <div className="flex items-center justify-between mb-4">
               <div className={`w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center ${item.color}`}>
                 <item.icon size={18} />
               </div>
             </div>
             <p className="text-3xl font-bold">{item.val}</p>
             <p className="text-sm font-semibold mt-1">{item.title}</p>
             <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold mb-6">Enrollment Growth Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Line type="monotone" dataKey="students" stroke="#534ab7" strokeWidth={3} dot={{ r: 4, fill: '#534ab7', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
