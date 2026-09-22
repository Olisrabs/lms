import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import InstructorTopbar from './InstructorTopbar';
import { usersApi } from '../../../lib/api';

export default function InstructorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(() => {
    return localStorage.getItem('instructor_selected_cohort_id');
  });

  const fetchCohorts = async () => {
    try {
      const res = await usersApi.getInstructorAssignments() as any[];
      if (res && res.length > 0) {
        const cohortList = res
          .map((a: any) => a.cohorts ? { id: a.cohorts.id, name: a.cohorts.name, status: a.cohorts.status, programId: a.program_id } : null)
          .filter(Boolean);

        setCohorts(cohortList);

        const stored = localStorage.getItem('instructor_selected_cohort_id');
        const exists = cohortList.some((c: any) => c.id === stored);
        if (!stored || !exists) {
          const active = cohortList.find((c: any) => c.status === 'active') || cohortList[0];
          if (active) {
            setSelectedCohortId(active.id);
            localStorage.setItem('instructor_selected_cohort_id', active.id);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load instructor cohorts:', err);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const handleSelectCohort = (id: string | null) => {
    setSelectedCohortId(id);
    if (id) {
      localStorage.setItem('instructor_selected_cohort_id', id);
    } else {
      localStorage.removeItem('instructor_selected_cohort_id');
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

      {/* Instructor Sidebar */}
      <InstructorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <InstructorTopbar
          onMenuClick={() => setSidebarOpen(true)}
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          onSelectCohort={handleSelectCohort}
        />

        <main className="lg:pl-64 pt-16 flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet
              context={{
                selectedCohortId,
                setSelectedCohortId: handleSelectCohort,
                cohorts,
                refreshCohorts: fetchCohorts,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
