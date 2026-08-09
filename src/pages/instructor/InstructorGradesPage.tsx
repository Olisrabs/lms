import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, TrendingUp, Trophy, Loader2 } from 'lucide-react';
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

export default function InstructorGradesPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load instructor assignments on mount
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        const data = await usersApi.getInstructorAssignments() as Assignment[];
        setAssignments(data || []);
        if (data && data.length > 0) {
          // Find the active cohort first, or default to the first
          const activeIdx = data.findIndex(a => a.cohorts?.status === 'active');
          setSelectedIdx(activeIdx >= 0 ? activeIdx : 0);
        }
      } catch (err: any) {
        console.error('Failed to load instructor assignments:', err);
        setError('Failed to load assigned cohorts and programs.');
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);

  // Fetch grades when selected assignment changes
  useEffect(() => {
    if (assignments.length === 0) return;
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const current = assignments[selectedIdx];
        const data = await gradesApi.getCohortGrades(current.cohort_id, current.program_id) as GradeRecord[];
        setGrades(data || []);
      } catch (err: any) {
        console.error('Failed to fetch cohort grades:', err);
        setError('Failed to fetch grades for the selected cohort.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [assignments, selectedIdx]);

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-500 bg-green-500/10';
    if (score >= 80) return 'text-blue-500 bg-blue-500/10';
    if (score >= 70) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  // Filter students based on search query
  const filteredGrades = grades.filter((g) =>
    g.users?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute metrics dynamically
  const totalStudents = grades.length;
  const classAvg = totalStudents > 0
    ? (grades.reduce((sum, g) => sum + (g.overall_score || 0), 0) / totalStudents).toFixed(1)
    : '0.0';
  const highestScore = totalStudents > 0
    ? Math.max(...grades.map((g) => g.overall_score || 0)).toFixed(1)
    : '0.0';
  const lowestScore = totalStudents > 0
    ? Math.min(...grades.map((g) => g.overall_score || 0)).toFixed(1)
    : '0.0';

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredGrades.length === 0) return;
    const headers = ['Student Name', 'Email', 'Assignments Avg', 'Tests Avg', 'Attendance Pct', 'Overall Score', 'Grade Letter'];
    const rows = filteredGrades.map(g => [
      g.users?.full_name || 'N/A',
      g.users?.email || 'N/A',
      g.assignment_avg ?? 0,
      g.test_avg ?? 0,
      g.attendance_pct ?? 0,
      g.overall_score ?? 0,
      g.grade_letter || 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gradebook_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gradebook</h1>
          <p className="text-muted-foreground">Manage and export student grades.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={filteredGrades.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} /> Export CSV
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Class Average</p>
              <p className="text-2xl font-bold">{loading ? '...' : `${classAvg}%`}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
              <p className="text-2xl font-bold">{loading ? '...' : `${highestScore}%`}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="rotate-180" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lowest Score</p>
              <p className="text-2xl font-bold">{loading ? '...' : `${lowestScore}%`}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
            />
          </div>

          {assignments.length > 0 ? (
            <select 
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
            >
              {assignments.map((a, idx) => (
                <option key={idx} value={idx}>
                  {a.cohorts?.name || 'Cohort'} — {a.programs?.name || 'Program'}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-muted-foreground font-semibold">No assigned cohorts found</span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-muted-foreground text-sm font-medium">Loading student grades...</span>
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No student grade records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="p-4 font-semibold text-sm">Student Name</th>
                  <th className="p-4 font-semibold text-sm">Assignments (20%)</th>
                  <th className="p-4 font-semibold text-sm">Tests (20%)</th>
                  <th className="p-4 font-semibold text-sm">Attendance (10%)</th>
                  <th className="p-4 font-semibold text-sm text-right">Final Grade</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((g) => (
                  <tr key={g.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {(g.users?.full_name || 'S').charAt(0)}
                        </div>
                        <span className="font-bold text-sm">{g.users?.full_name || 'Unknown Student'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium">{(g.assignment_avg ?? 0).toFixed(1)}%</td>
                    <td className="p-4 text-sm font-medium">{(g.test_avg ?? 0).toFixed(1)}%</td>
                    <td className="p-4 text-sm font-medium">{(g.attendance_pct ?? 0).toFixed(1)}%</td>
                    <td className="p-4 text-right">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold inline-block min-w-[60px] text-center ${getGradeColor(g.overall_score)}`}>
                        {(g.overall_score ?? 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
