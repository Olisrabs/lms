import { 
  CheckSquare, Search, Filter, Plus, MoreVertical
} from 'lucide-react';

const tests = [
  { id: 1, title: 'Frontend Basics Quiz', questions: 20, attempts: 45, average: '88%', status: 'Published' },
  { id: 2, title: 'Database SQL Midterm', questions: 50, attempts: 38, average: '76%', status: 'Published' },
  { id: 3, title: 'React Performance Test', questions: 15, attempts: 0, average: '-', status: 'Draft' },
];

export default function TestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Test Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage quizzes, midterms, and final exams.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Plus size={16} /> Create Test
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search tests..." 
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
                <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Test Title</th>
                <th className="px-4 py-3 font-medium">Questions</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Average Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tests.map((test, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors group cursor-pointer">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                        <CheckSquare size={18} />
                      </div>
                      <span className="font-semibold">{test.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{test.questions}</td>
                  <td className="px-4 py-4 text-muted-foreground">{test.attempts}</td>
                  <td className="px-4 py-4 font-bold text-foreground">{test.average}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      test.status === 'Published' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {test.status}
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
