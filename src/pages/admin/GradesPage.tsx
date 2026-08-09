import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search, Filter, Download, Edit2, RefreshCw, Trophy
} from 'lucide-react';
import { gradesApi } from '../../lib/api';

interface GradeRow {
  id: string;
  student?: { id: string; full_name: string };
  users?: { id: string; full_name: string; email: string; avatar_url?: string };
  overall_score?: number;
  assignment_avg?: number;
  test_avg?: number;
  attendance_pct?: number;
  cohorts?: { id: string; name: string; programs?: { name: string } };
}

function gradeLabel(score?: number): string {
  if (score === undefined || score === null) return '—';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function gradeColor(score?: number): string {
  if (score === undefined || score === null) return 'bg-secondary/30 text-muted-foreground';
  if (score >= 90) return 'bg-accent/10 text-accent';
  if (score >= 70) return 'bg-primary/10 text-primary';
  return 'bg-orange-500/10 text-orange-500';
}

export default function GradesPage() {
  const { selectedCohortId } = useOutletContext<{ selectedCohortId: string | null }>();
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gradesApi.getCohortGrades(selectedCohortId || undefined) as any;
      const rows: GradeRow[] = Array.isArray(res) ? res : res.grades ?? [];
      setGrades(rows);
    } catch (e) {
      console.warn('Failed to load grades:', e);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCohortId]);

  useEffect(() => { load(); }, [load]);

  const filtered = grades.filter(g =>
    !search || g.student?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Compute class averages
  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((s, g) => s + (g.overall_score ?? 0), 0) / filtered.length)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gradebook</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length > 0 
              ? `${filtered.length} student${filtered.length !== 1 ? 's' : ''} · Class average: ${avgScore}%`
              : 'No grade records yet'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="bg-secondary/50 text-foreground border border-border px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="bg-secondary/50 text-foreground border border-border px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary transition-all flex items-center gap-2">
            <Edit2 size={16} /> Edit Grades
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Grade weight legend */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Assignments', weight: '20%', color: 'border-l-primary' },
          { label: 'Tests',       weight: '20%', color: 'border-l-purple-500' },
          { label: 'Attendance',  weight: '10%', color: 'border-l-amber-500' },
          { label: 'Capstone',    weight: '50%', color: 'border-l-accent' },
        ].map(({ label, weight, color }) => (
          <div key={label} className={`glass-card rounded-xl p-4 border-l-4 ${color} flex items-center justify-between`}>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
              <p className="text-lg font-bold">{weight}</p>
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
            <p className="text-sm text-muted-foreground">Loading grades…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Trophy size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">No grade records yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Grades will appear here as instructors grade assignments, tests, and capstones.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Student</th>
                  <th className="px-4 py-3 font-medium text-center">Assignments (/20)</th>
                  <th className="px-4 py-3 font-medium text-center">Tests (/20)</th>
                  <th className="px-4 py-3 font-medium text-center">Attendance (/10)</th>
                  <th className="px-4 py-3 font-medium text-center">Capstone (/50)</th>
                  <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Final Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((g) => {
                  // Compute weighted final from components if overall_score not set
                  const final = g.overall_score !== undefined && g.overall_score !== null
                    ? Math.round(g.overall_score)
                    : null;

                  const asgn = g.assignment_avg !== undefined && g.assignment_avg !== null ? `${Math.round(g.assignment_avg)}%` : '—';
                  const test = g.test_avg !== undefined && g.test_avg !== null ? `${Math.round(g.test_avg)}%` : '—';
                  const att  = g.attendance_pct !== undefined && g.attendance_pct !== null ? `${Math.round(g.attendance_pct)}%` : '—';
                  const cap  = '—';

                  const studentName = g.student?.full_name ?? g.users?.full_name ?? '—';

                  return (
                    <tr key={g.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.cohorts?.programs?.name ?? g.cohorts?.name ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-muted-foreground">{asgn}</td>
                      <td className="px-4 py-4 text-center font-medium text-muted-foreground">{test}</td>
                      <td className="px-4 py-4 text-center font-medium text-muted-foreground">{att}</td>
                      <td className="px-4 py-4 text-center font-medium text-muted-foreground">{cap}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`inline-block px-3 py-1 rounded-lg font-bold ${gradeColor(final ?? undefined)}`}>
                          {final !== null ? `${final}% (${gradeLabel(final)})` : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
