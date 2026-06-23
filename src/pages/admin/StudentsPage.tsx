import { 
  Search, Filter, Download, MoreVertical, 
  Mail, MoreHorizontal
} from 'lucide-react';

const studentsData = [
  { id: 'STU-001', name: 'Alice Johnson', email: 'alice@example.com', program: 'Frontend Eng.', cohort: 'Cohort A', attendance: '95%', grade: 'A', status: 'Active' },
  { id: 'STU-002', name: 'Bob Smith', email: 'bob@example.com', program: 'Backend Dev.', cohort: 'Cohort B', attendance: '88%', grade: 'B+', status: 'Active' },
  { id: 'STU-003', name: 'Charlie Davis', email: 'charlie@example.com', program: 'UI/UX Design', cohort: 'Cohort C', attendance: '72%', grade: 'C', status: 'At Risk' },
  { id: 'STU-004', name: 'Diana Ross', email: 'diana@example.com', program: 'Frontend Eng.', cohort: 'Cohort A', attendance: '98%', grade: 'A+', status: 'Active' },
];

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all students in the academy.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary/50 transition-all flex items-center gap-2">
            Bulk Actions <MoreHorizontal size={16} />
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search students..." 
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
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Program & Cohort</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentsData.map((student, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors group cursor-pointer">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail size={10}/> {student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{student.id}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{student.program}</p>
                    <p className="text-xs text-muted-foreground">{student.cohort}</p>
                  </td>
                  <td className="px-4 py-4 font-medium">{student.attendance}</td>
                  <td className="px-4 py-4 font-bold text-primary">{student.grade}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.status === 'Active' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {student.status}
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
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
          <span>Showing 1 to 4 of 4,521 entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
