import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Download, FileText, FileSpreadsheet,
  TrendingUp, Users, GraduationCap, CheckCircle2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { usersApi, gradesApi } from '../../lib/api';

export default function ReportsPage() {
  const { selectedCohortId, cohorts } = useOutletContext<{ selectedCohortId: string | null; cohorts: any[] }>();
  const activeCohort = cohorts.find(c => c.id === selectedCohortId);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentsCount: 0,
    instructorsCount: 0,
    gradRate: 0,
    classAverage: 0,
  });
  const [growthData, setGrowthData] = useState<any[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard stats for active cohort
        const dashStats = await usersApi.getAdminDashboardStats(selectedCohortId || undefined) as any;
        
        // Fetch grades for active cohort
        let gradesList: any[] = [];
        if (selectedCohortId) {
          const gradesRes = await gradesApi.getCohortGrades(selectedCohortId) as any;
          gradesList = Array.isArray(gradesRes) ? gradesRes : gradesRes.grades ?? [];
        }

        const eligible = gradesList.filter(g => (g.overall_score ?? 0) >= 50).length;
        const gradRate = gradesList.length > 0 ? Math.round((eligible / gradesList.length) * 100) : 0;
        
        const avgScore = gradesList.length > 0
          ? Math.round(gradesList.reduce((s, g) => s + (g.overall_score ?? 0), 0) / gradesList.length)
          : 0;

        setStats({
          studentsCount: dashStats.totalStudents || 0,
          instructorsCount: dashStats.totalInstructors || 0,
          gradRate,
          classAverage: avgScore
        });

        // Load cohort growth data across all cohorts
        const growth = [];
        for (const cohort of cohorts) {
          try {
            const cohortStats = await usersApi.getAdminDashboardStats(cohort.id) as any;
            growth.push({
              name: cohort.name,
              students: cohortStats.totalStudents || 0
            });
          } catch (e) {
            // ignore
          }
        }
        setGrowthData(growth);
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedCohortId, cohorts]);

  const exportPDF = () => {
    window.print();
  };

  const exportReport = (format: 'csv' | 'excel') => {
    const cohortName = activeCohort?.name || 'All Cohorts';
    const rows = [
      ['Make It Simple Academy - Performance Analytics Report'],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Target Cohort', `"${cohortName}"`],
      [''],
      ['Metric', 'Value'],
      ['Total Enrolled Students', stats.studentsCount],
      ['Assigned Instructors', stats.instructorsCount],
      ['Graduation Eligibility Rate', `${stats.gradRate}%`],
      ['Class Average Score', `${stats.classAverage}%`],
      [''],
      ['Cohort Growth Breakdown'],
      ['Cohort Name', 'Total Students'],
      ...growthData.map(g => [`"${g.name}"`, g.students])
    ];

    const content = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([content], { type: format === 'excel' ? 'application/vnd.ms-excel;charset=utf-8;' : 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cohort_report_${cohortName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep dive into academy performance metrics for <span className="font-bold text-foreground">{activeCohort?.name || 'All Cohorts'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportPDF}
            className="px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all flex items-center gap-2 cursor-pointer"
            title="Print or Save as PDF"
          >
            <FileText size={16} className="text-red-500" /> PDF
          </button>
          <button 
            onClick={() => exportReport('excel')}
            className="px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all flex items-center gap-2 cursor-pointer"
            title="Download Excel spreadsheet"
          >
            <FileSpreadsheet size={16} className="text-accent" /> Excel
          </button>
          <button 
            onClick={() => exportReport('csv')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer"
            title="Download CSV report"
          >
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Analyzing cohort data…</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Enrollment Count', val: stats.studentsCount, desc: 'students in cohort', icon: Users, color: 'text-primary' },
              { title: 'Instructors Assigned', val: stats.instructorsCount, desc: 'instructors in cohort', icon: GraduationCap, color: 'text-purple-500' },
              { title: 'Class Average', val: stats.classAverage > 0 ? `${stats.classAverage}%` : 'N/A', desc: 'from gradebook', icon: CheckCircle2, color: 'text-amber-500' },
              { title: 'Graduation Rate', val: stats.gradRate > 0 ? `${stats.gradRate}%` : 'N/A', desc: 'score >= 50%', icon: TrendingUp, color: 'text-accent' },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border-t-4 border-t-border hover:border-t-primary transition-all">
                 <div className="flex items-center justify-between mb-4">
                   <div className={`w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center ${item.color}`}>
                     <item.icon size={18} />
                   </div>
                 </div>
                 <p className="text-3xl font-bold">{item.val}</p>
                 <p className="text-sm font-semibold mt-1">{item.title}</p>
                 <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6">Enrollment Growth Trend</h3>
            {growthData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No cohort enrollment data available for chart.</div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line type="monotone" dataKey="students" stroke="#0047D6" strokeWidth={3} dot={{ r: 4, fill: '#0047D6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
