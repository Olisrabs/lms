import { 
  CheckCircle2, XCircle, AlertCircle,
  Search, Filter, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const attendanceData = [
  { student: 'Alice Johnson', class: 'React Patterns', date: 'Oct 22, 2026', status: 'Present' },
  { student: 'Bob Smith', class: 'React Patterns', date: 'Oct 22, 2026', status: 'Late' },
  { student: 'Charlie Davis', class: 'React Patterns', date: 'Oct 22, 2026', status: 'Absent' },
  { student: 'Diana Ross', class: 'React Patterns', date: 'Oct 22, 2026', status: 'Present' },
];

const chartData = [
  { name: 'Mon', present: 95, absent: 5, late: 2 },
  { name: 'Tue', present: 88, absent: 12, late: 5 },
  { name: 'Wed', present: 92, absent: 8, late: 1 },
  { name: 'Thu', present: 85, absent: 15, late: 4 },
  { name: 'Fri', present: 90, absent: 10, late: 3 },
];

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and analyze student presence across cohorts.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
           <h3 className="text-lg font-bold mb-6">Weekly Attendance Trends</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--secondary)', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="present" stackId="a" fill="#0f7a5a" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="late" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="glass-card rounded-3xl p-6 flex flex-col justify-center gap-6">
           <div className="text-center">
             <div className="inline-flex w-16 h-16 rounded-full bg-accent/10 items-center justify-center text-accent mb-3">
               <CheckCircle2 size={32} />
             </div>
             <p className="text-4xl font-bold">92%</p>
             <p className="text-sm text-muted-foreground mt-1">Overall Attendance</p>
           </div>
           
           <div className="space-y-3 pt-6 border-t border-border">
             <div className="flex items-center justify-between text-sm">
               <span className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 size={16} className="text-accent"/> Present</span>
               <span className="font-bold">4,159</span>
             </div>
             <div className="flex items-center justify-between text-sm">
               <span className="flex items-center gap-2 text-muted-foreground"><AlertCircle size={16} className="text-amber-500"/> Late</span>
               <span className="font-bold">210</span>
             </div>
             <div className="flex items-center justify-between text-sm">
               <span className="flex items-center gap-2 text-muted-foreground"><XCircle size={16} className="text-red-500"/> Absent</span>
               <span className="font-bold">152</span>
             </div>
           </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors">
              <Calendar size={16} /> Date
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-secondary/30">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Student</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendanceData.map((record, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-4 font-semibold">{record.student}</td>
                  <td className="px-4 py-4 text-muted-foreground">{record.class}</td>
                  <td className="px-4 py-4 font-medium text-muted-foreground">{record.date}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      record.status === 'Present' ? 'bg-accent/10 text-accent' : 
                      record.status === 'Absent' ? 'bg-red-500/10 text-red-500' : 
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {record.status === 'Present' && <CheckCircle2 size={12}/>}
                      {record.status === 'Absent' && <XCircle size={12}/>}
                      {record.status === 'Late' && <AlertCircle size={12}/>}
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
