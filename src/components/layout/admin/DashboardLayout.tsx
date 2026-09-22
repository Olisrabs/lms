import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { programsApi } from '../../../lib/api';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(() => {
    return localStorage.getItem('admin_selected_cohort_id');
  });
  const [loadingCohorts, setLoadingCohorts] = useState(true);

  const fetchCohorts = async () => {
    try {
      const res = await programsApi.listAllCohorts();
      setCohorts(res || []);
      
      const stored = localStorage.getItem('admin_selected_cohort_id');
      if (res && res.length > 0) {
        const exists = res.some((c: any) => c.id === stored);
        if (!stored || !exists) {
          setSelectedCohortId(res[0].id);
          localStorage.setItem('admin_selected_cohort_id', res[0].id);
        }
      } else {
        setSelectedCohortId(null);
      }
    } catch (err) {
      console.error('Failed to load cohorts', err);
    } finally {
      setLoadingCohorts(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const handleSelectCohort = (id: string | null) => {
    setSelectedCohortId(id);
    if (id) {
      localStorage.setItem('admin_selected_cohort_id', id);
    } else {
      localStorage.removeItem('admin_selected_cohort_id');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex dashboard-pattern-bg">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)} 
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          onSelectCohort={handleSelectCohort}
        />
        <main className="lg:pl-64 pt-16 flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet context={{ selectedCohortId, setSelectedCohortId: handleSelectCohort, cohorts, loadingCohorts, refreshCohorts: fetchCohorts }} />
          </div>
        </main>
      </div>
    </div>
  );
}
