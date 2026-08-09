import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, AlertCircle, Loader2, Search, Trophy } from 'lucide-react';
import { usersApi, gradesApi } from '../../lib/api';

interface Assignment {
  cohort_id: string;
  program_id: string;
  cohorts: { id: string; name: string; status: string };
  programs: { id: string; name: string };
}

interface GradeRecord {
  id: string;
  assignment_avg: number;
  test_avg: number;
  attendance_pct: number;
  overall_score: number;
  grade_letter: string;
  updated_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

function getLetterGrade(score: number) {
  if (score >= 90) return { letter: 'A', color: 'text-green-500 bg-green-500/10' };
  if (score >= 80) return { letter: 'B', color: 'text-blue-500 bg-blue-500/10' };
  if (score >= 70) return { letter: 'C', color: 'text-yellow-500 bg-yellow-500/10' };
  if (score >= 60) return { letter: 'D', color: 'text-orange-500 bg-orange-500/10' };
  return { letter: 'F', color: 'text-red-500 bg-red-500/10' };
}

export default function InstructorPerformancePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await usersApi.getInstructorAssignments() as Assignment[];
        setAssignments(data || []);
        if (data && data.length > 0) {
          const activeIdx = data.findIndex(a => a.cohorts?.status === 'active');
          setSelectedIdx(activeIdx >= 0 ? activeIdx : 0);
        }
      } catch (err) {
        console.error('Failed to load assignments', err);
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (assignments.length === 0) return;
    const fetchGrades = async () => {
      setLoading(true);
      setError(null);
      try {
        const current = assignments[selectedIdx];
        const data = await gradesApi.getCohortGrades(current.cohort_id, current.program_id) as GradeRecord[];
        setGrades(data || []);
      } catch (err: any) {
        setError('Failed to fetch student performance data.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [assignments, selectedIdx]);

  const filtered = grades.filter(g =>
    g.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = grades.length;
  const classAvg = totalStudents > 0
    ? (grades.reduce((sum, g) => sum + (g.overall_score || 0), 0) / totalStudents)
    : 0;
  const topPerformers = [...grades].sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0)).slice(0, 3);
  const atRisk = grades.filter(g => (g.overall_score || 0) < 60);
  const avgAttendance = totalStudents > 0
    ? (grades.reduce((sum, g) => sum + (g.attendance_pct || 0), 0) / totalStudents)
    : 0;

  const stats = [
    { label: 'Avg Class Grade', value: loading ? '...' : `${classAvg.toFixed(1)}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Students', value: loading ? '...' : String(totalStudents), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'At-Risk Students', value: loading ? '...' : String(atRisk.length), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Avg Attendance', value: loading ? '...' : `${avgAttendance.toFixed(1)}%`, icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Performance</h1>
          <p className="text-muted-foreground">Analytics and early warning indicators for your cohorts.</p>
        </div>
        {assignments.length > 1 && (
          <select
            value={selectedIdx}
            onChange={e => setSelectedIdx(Number(e.target.value))}
            className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {assignments.map((a, i) => (
              <option key={i} value={i}>
                {a.cohorts?.name} — {a.programs?.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Student Performance Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <span className="text-sm text-muted-foreground font-medium">{filtered.length} students</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-muted-foreground text-sm">Loading student performance...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No student performance data found</p>
            <p className="text-sm mt-1">Data will appear as grades are recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="p-4 font-semibold text-sm">Student</th>
                  <th className="p-4 font-semibold text-sm">Assignments</th>
                  <th className="p-4 font-semibold text-sm">Tests</th>
                  <th className="p-4 font-semibold text-sm">Attendance</th>
                  <th className="p-4 font-semibold text-sm text-right">Overall Performance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const grade = getLetterGrade(g.overall_score || 0);
                  return (
                    <tr key={g.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {(g.users?.full_name || 'S').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{g.users?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{g.users?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium">{(g.assignment_avg ?? 0).toFixed(1)}%</td>
                      <td className="p-4 text-sm font-medium">{(g.test_avg ?? 0).toFixed(1)}%</td>
                      <td className="p-4 text-sm font-medium">{(g.attendance_pct ?? 0).toFixed(1)}%</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold">{(g.overall_score ?? 0).toFixed(1)}%</p>
                            <div className="w-20 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(g.overall_score || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-sm font-black ${grade.color}`}>
                            {grade.letter}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Top Performers & At-Risk */}
      {!loading && grades.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy size={20} className="text-primary" /> Top Performers</h2>
            <div className="space-y-3">
              {topPerformers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data yet</p>
              ) : topPerformers.map((g, i) => {
                const grade = getLetterGrade(g.overall_score || 0);
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        {(g.users?.full_name || 'S').charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{g.users?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-500">{(g.overall_score || 0).toFixed(1)}%</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-black ${grade.color}`}>{grade.letter}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2"><AlertCircle size={20} /> Early Warnings (F)</h2>
            <div className="space-y-3">
              {atRisk.length === 0 ? (
                <div className="p-4 text-center text-green-500 font-medium text-sm">
                  🎉 No at-risk students — great performance!
                </div>
              ) : atRisk.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                  <div>
                    <p className="font-bold text-sm">{g.users?.full_name}</p>
                    <p className="text-xs text-red-500">Overall score: {(g.overall_score || 0).toFixed(1)}%</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-sm font-black text-red-500 bg-red-500/10">F</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
