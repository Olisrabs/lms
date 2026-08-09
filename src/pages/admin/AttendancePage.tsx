import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertCircle,
  Search, Filter, Calendar, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../../lib/api';

interface AttendanceRecord {
  id: string;
  student: { full_name: string };
  class_schedule: { title: string; start_time: string };
  status: 'present' | 'absent' | 'late';
  date?: string;
}

interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
}

export default function AttendancePage() {
  const { selectedCohortId } = useOutletContext<{ selectedCohortId: string | null }>();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({ present: 0, late: 0, absent: 0, total: 0, rate: 0 });
  const [chartData, setChartData] = useState<Array<{ name: string; present: number; late: number; absent: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cohortQuery = selectedCohortId ? `&cohort_id=${selectedCohortId}` : '';
      const res = await api.get<any>(`/attendance?limit=50${cohortQuery}`);
      const rawRecords: AttendanceRecord[] = res.records ?? res ?? [];
      setRecords(rawRecords);

      // Compute summary
      const present = rawRecords.filter(r => r.status === 'present').length;
      const late    = rawRecords.filter(r => r.status === 'late').length;
      const absent  = rawRecords.filter(r => r.status === 'absent').length;
      const total   = rawRecords.length;
      const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      setSummary({ present, late, absent, total, rate });

      // Build weekly chart from records
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const dayMap: Record<string, { present: number; late: number; absent: number }> = {};
      days.forEach(d => { dayMap[d] = { present: 0, late: 0, absent: 0 }; });
      rawRecords.forEach(r => {
        const date = new Date(r.class_schedule?.start_time ?? Date.now());
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        if (dayMap[dayName]) {
          dayMap[dayName][r.status]++;
        }
      });
      setChartData(days.map(name => ({ name, ...dayMap[name] })));
    } catch (e) {
      console.warn('Failed to load attendance:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCohortId]);

  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r =>
    !search || r.student?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and analyze student presence across cohorts.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary/50 transition-all flex items-center gap-2 disabled:opacity-50 w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-6">Weekly Attendance Trends</h3>
          {summary.total === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
              <Calendar size={32} className="text-muted-foreground" />
              <p className="font-semibold text-sm">No attendance data yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">Charts will appear once attendance is recorded for classes.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--secondary)', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="present" name="Present" stackId="a" fill="#0f7a5a" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="late"    name="Late"    stackId="a" fill="#f59e0b" />
                  <Bar dataKey="absent"  name="Absent"  stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card rounded-3xl p-6 flex flex-col justify-center gap-6">
          <div className="text-center">
            <div className="inline-flex w-16 h-16 rounded-full bg-accent/10 items-center justify-center text-accent mb-3">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-4xl font-bold">{summary.total === 0 ? '—' : `${summary.rate}%`}</p>
            <p className="text-sm text-muted-foreground mt-1">Overall Attendance</p>
          </div>

          <div className="space-y-3 pt-6 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 size={16} className="text-accent" /> Present</span>
              <span className="font-bold">{summary.present}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><AlertCircle size={16} className="text-amber-500" /> Late</span>
              <span className="font-bold">{summary.late}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><XCircle size={16} className="text-red-500" /> Absent</span>
              <span className="font-bold">{summary.absent}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors">
              <Calendar size={16} /> Date
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-semibold text-sm">No attendance records yet</p>
            <p className="text-xs text-muted-foreground mt-2">Records appear as students join classes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Student</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-4 font-semibold">{record.student?.full_name ?? '—'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{record.class_schedule?.title ?? '—'}</td>
                    <td className="px-4 py-4 font-medium text-muted-foreground">
                      {record.class_schedule?.start_time
                        ? new Date(record.class_schedule.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        record.status === 'present' ? 'bg-accent/10 text-accent'
                        : record.status === 'absent' ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {record.status === 'present' && <CheckCircle2 size={12} />}
                        {record.status === 'absent'  && <XCircle size={12} />}
                        {record.status === 'late'    && <AlertCircle size={12} />}
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
