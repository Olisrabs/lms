
import { 
  FileText, Clock, CheckCircle2, AlertCircle,
  Search, Filter, Plus, MoreVertical
} from 'lucide-react';

const stats = [
  { label: 'Active Assignments', value: '45', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Pending Reviews', value: '156', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Late Submissions', value: '23', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { label: 'Average Score', value: '82%', icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10' },
];

const assignments = [
  { id: 1, title: 'React Hooks Deep Dive', cohort: 'Cohort A', instructor: 'Sarah J.', due: 'Today, 11:59 PM', submissions: '42/45', status: 'Active' },
  { id: 2, title: 'Database Design Schema', cohort: 'Cohort B', instructor: 'David S.', due: 'Tomorrow, 11:59 PM', submissions: '15/38', status: 'Active' },
  { id: 3, title: 'UI Wireframing Basics', cohort: 'Cohort C', instructor: 'Michael R.', due: 'Oct 25, 2026', submissions: '0/25', status: 'Scheduled' },
  { id: 4, title: 'Node.js Authentication', cohort: 'Cohort A', instructor: 'Sarah J.', due: 'Oct 15, 2026', submissions: '45/45', status: 'Completed' },
];

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage coursework and grade student submissions.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Plus size={16} /> Create Assignment
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search assignments..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors shrink-0">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-secondary/30">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Title</th>
                <th className="px-4 py-3 font-medium">Cohort</th>
                <th className="px-4 py-3 font-medium">Instructor</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Submissions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((assignment, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors group cursor-pointer">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText size={18} />
                      </div>
                      <span className="font-semibold">{assignment.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{assignment.cohort}</td>
                  <td className="px-4 py-4 text-muted-foreground">{assignment.instructor}</td>
                  <td className="px-4 py-4 font-medium">{assignment.due}</td>
                  <td className="px-4 py-4 font-medium">{assignment.submissions}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      assignment.status === 'Active' ? 'bg-primary/10 text-primary' : 
                      assignment.status === 'Completed' ? 'bg-accent/10 text-accent' : 
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors">
                      <MoreVertical size={16} />
                    </button>
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
