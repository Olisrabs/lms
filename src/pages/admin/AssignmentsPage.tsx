import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FileText, Clock, CheckCircle2, AlertCircle,
  Search, Filter, MoreVertical
} from 'lucide-react';
import { assignmentsApi } from '../../lib/api';

export default function AssignmentsPage() {
  const { selectedCohortId } = useOutletContext<{ selectedCohortId: string | null; cohorts: any[] }>();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentsApi.list(selectedCohortId || undefined) as any;
      setAssignments(res || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedCohortId]);


  // Metrics (computed from live list)
  const totalAssignments = assignments.length;
  const individualCount = assignments.filter((a: any) => a.assignment_type === 'individual').length;
  const groupCount = assignments.filter((a: any) => a.assignment_type === 'group').length;
  const averageMaxScore = totalAssignments > 0 
    ? Math.round(assignments.reduce((sum: number, a: any) => sum + (a.max_score || 0), 0) / totalAssignments)
    : 0;

  const stats = [
    { label: 'Total Coursework', value: totalAssignments.toString(), icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Individual Tasks', value: individualCount.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Group Projects', value: groupCount.toString(), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Avg Max Points', value: `${averageMaxScore} pts`, icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10' },
  ];


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage coursework and grade student submissions.</p>
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
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No assignments found for this cohort.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Max Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <span className="font-semibold block">{assignment.title}</span>
                          {assignment.description && <span className="text-xs text-muted-foreground block line-clamp-1">{assignment.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground capitalize">{assignment.assignment_type}</td>
                    <td className="px-4 py-4 font-medium">
                      {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(assignment.due_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-4 font-medium">{assignment.max_score} pts</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        assignment.is_published ? 'bg-accent/10 text-accent' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {assignment.is_published ? 'Published' : 'Draft'}
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
          )}
        </div>
      </div>


    </div>
  );
}
