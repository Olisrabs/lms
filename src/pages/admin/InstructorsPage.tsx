import { 
  Search, Filter, Plus, MoreVertical, 
  Users, Mail
} from 'lucide-react';

const instructorsData = [
  { id: 'INS-001', name: 'Dr. Emily Chen', email: 'emily.chen@example.com', cohorts: ['Cohort A', 'Cohort B'], courses: ['React Patterns', 'Advanced JS'], students: 83, status: 'Active' },
  { id: 'INS-002', name: 'Michael Ross', email: 'michael.r@example.com', cohorts: ['Cohort C'], courses: ['UI/UX Fundamentals'], students: 25, status: 'Active' },
  { id: 'INS-003', name: 'Sarah Jenkins', email: 'sarah.j@example.com', cohorts: ['Cohort B'], courses: ['Node.js APIs', 'Databases'], students: 38, status: 'On Leave' },
];

export default function InstructorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Instructors Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage teaching staff and course assignments.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Plus size={16} /> Add Instructor
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search instructors..." 
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
                <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Profile</th>
                <th className="px-4 py-3 font-medium">Assigned Cohorts</th>
                <th className="px-4 py-3 font-medium">Assigned Courses</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {instructorsData.map((instructor, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors group cursor-pointer">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {instructor.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{instructor.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail size={10}/> {instructor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {instructor.cohorts.map((c, idx) => (
                        <span key={idx} className="bg-secondary/50 border border-border px-2 py-0.5 rounded-md text-xs">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {instructor.courses.map((c, idx) => (
                        <span key={idx} className="bg-primary/5 border border-primary/20 text-primary px-2 py-0.5 rounded-md text-xs">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-muted-foreground flex items-center gap-1">
                    <Users size={14} /> {instructor.students}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      instructor.status === 'Active' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {instructor.status}
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
