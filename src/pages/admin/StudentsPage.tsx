import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Download, MoreVertical, 
  Mail, Users, RefreshCw
} from 'lucide-react';
import { usersApi } from '../../lib/api';
import type { AuthUser } from '../../lib/api';

interface StudentRow extends AuthUser {
  enrollment?: {
    program?: { name: string };
    cohort?: { name: string };
    overall_score?: number;
    attendance_pct?: number;
  };
}

function gradeFromScore(score?: number): string {
  if (score === undefined || score === null) return '—';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ 
        role: 'student', 
        page, 
        limit, 
        search: search || undefined,
      }) as any;
      setStudents(res.users || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.warn('Failed to load students:', e);
      setStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const handleExport = () => {
    alert("Exporting students directory as CSV...");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total > 0 ? `${total.toLocaleString()} students enrolled` : 'No students yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={handleExport}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
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
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors shrink-0">
            <Filter size={16} /> Filter
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading students…</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Users size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">No students found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search ? 'Try a different search term.' : 'Students will appear here once they sign up and complete onboarding.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Profile</th>
                    <th className="px-4 py-3 font-medium">Student ID</th>
                    <th className="px-4 py-3 font-medium">Program & Cohort</th>
                    <th className="px-4 py-3 font-medium">Grade</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt={s.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                              {s.full_name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail size={10} /> {s.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground font-mono text-xs">
                        {s.id.split('-')[0].toUpperCase()}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{(s as any).enrollment?.program?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{(s as any).enrollment?.cohort?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-4 font-bold text-primary">
                        {gradeFromScore((s as any).enrollment?.overall_score)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {s.status ?? 'active'}
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
              <span>Showing {from}–{to} of {total.toLocaleString()} entries</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2 font-medium">{page} / {totalPages || 1}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
