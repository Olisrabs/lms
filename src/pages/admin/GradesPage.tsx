import { 
  Search, Filter, Download, Edit2
} from 'lucide-react';

const gradesData = [
  { student: 'Alice Johnson', id: 'STU-001', assignment: 18, tests: 19, attendance: 10, capstone: 48, final: 95 },
  { student: 'Bob Smith', id: 'STU-002', assignment: 15, tests: 16, attendance: 9, capstone: 40, final: 80 },
  { student: 'Charlie Davis', id: 'STU-003', assignment: 12, tests: 14, attendance: 7, capstone: 35, final: 68 },
];

export default function GradesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gradebook</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage final grades calculation.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-secondary/50 text-foreground border border-border px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary transition-all flex items-center gap-2">
            <Edit2 size={16} /> Edit Grades
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary flex items-center justify-between">
           <div>
             <p className="text-xs text-muted-foreground font-medium mb-1">Assignments</p>
             <p className="text-lg font-bold">20%</p>
           </div>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-purple-500 flex items-center justify-between">
           <div>
             <p className="text-xs text-muted-foreground font-medium mb-1">Tests</p>
             <p className="text-lg font-bold">20%</p>
           </div>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
           <div>
             <p className="text-xs text-muted-foreground font-medium mb-1">Attendance</p>
             <p className="text-lg font-bold">10%</p>
           </div>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-accent flex items-center justify-between">
           <div>
             <p className="text-xs text-muted-foreground font-medium mb-1">Capstone</p>
             <p className="text-lg font-bold">50%</p>
           </div>
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
                <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Student</th>
                <th className="px-4 py-3 font-medium text-center">Assignments (/20)</th>
                <th className="px-4 py-3 font-medium text-center">Tests (/20)</th>
                <th className="px-4 py-3 font-medium text-center">Attendance (/10)</th>
                <th className="px-4 py-3 font-medium text-center">Capstone (/50)</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Final Grade (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gradesData.map((grade, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors group">
                  <td className="px-4 py-4">
                    <p className="font-semibold">{grade.student}</p>
                    <p className="text-xs text-muted-foreground">{grade.id}</p>
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-muted-foreground">{grade.assignment}</td>
                  <td className="px-4 py-4 text-center font-medium text-muted-foreground">{grade.tests}</td>
                  <td className="px-4 py-4 text-center font-medium text-muted-foreground">{grade.attendance}</td>
                  <td className="px-4 py-4 text-center font-medium text-muted-foreground">{grade.capstone}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`inline-block px-3 py-1 rounded-lg font-bold ${
                      grade.final >= 90 ? 'bg-accent/10 text-accent' :
                      grade.final >= 70 ? 'bg-primary/10 text-primary' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {grade.final}%
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
