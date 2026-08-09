import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CheckSquare, Search, Filter
} from 'lucide-react';
import { testsApi } from '../../lib/api';

export default function TestsPage() {
  const { selectedCohortId } = useOutletContext<{ selectedCohortId: string | null; cohorts: any[] }>();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await testsApi.list(selectedCohortId || undefined) as any;
      setTests(res || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [selectedCohortId]);


  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await testsApi.publish(id, !currentStatus);
      fetchTests();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test Management</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage quizzes, midterms, and final exams.</p>
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
          {loading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse">Loading tests...</div>
          ) : tests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No tests found for this cohort.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Test Title</th>
                  <th className="px-4 py-3 font-medium">Duration (Mins)</th>
                  <th className="px-4 py-3 font-medium">Max Score</th>
                  <th className="px-4 py-3 font-medium">Passing Score</th>
                  <th className="px-4 py-3 font-medium text-right rounded-tr-xl rounded-br-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                          <CheckSquare size={18} />
                        </div>
                        <div>
                          <span className="font-semibold block">{test.title}</span>
                          {test.description && <span className="text-xs text-muted-foreground block line-clamp-1">{test.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-semibold">{test.duration_mins} mins</td>
                    <td className="px-4 py-4 text-muted-foreground font-semibold">{test.max_score || 100} pts</td>
                    <td className="px-4 py-4 text-muted-foreground font-semibold">{test.pass_score || 50} pts</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleTogglePublish(test.id, test.is_published)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 ${
                          test.is_published ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-secondary text-muted-foreground border border-border'
                        }`}
                      >
                        {test.is_published ? 'Published' : 'Draft'}
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
