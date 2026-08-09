import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { 
  Plus, Search, Filter,
  Users, GraduationCap, Calendar, X, Trash2, CheckCircle, Play, UserPlus, BookOpen
} from 'lucide-react';

import { programsApi, usersApi } from '../../lib/api';

interface Cohort {
  id: string;
  name: string;
  programName: string;
  programId: string;
  programsList?: ProgramOption[];
  start: string;
  end: string;
  students: number;
  instructors: number;
  progress: number;
  status: 'active' | 'upcoming' | 'completed';
  metadata?: any;
}

interface ProgramOption {
  id: string;
  name: string;
}

export default function CohortsPage() {
  const { refreshCohorts } = useOutletContext<{ refreshCohorts?: () => Promise<void> }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [cohortName, setCohortName] = useState('');
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationCloseDate, setRegistrationCloseDate] = useState('');
  const [cohortStatus, setCohortStatus] = useState<'upcoming' | 'active'>('upcoming');
  const [error, setError] = useState<string | null>(null);



  // Assign Instructors Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningCohort, setAssigningCohort] = useState<Cohort | null>(null);
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [selectedAssignProgramId, setSelectedAssignProgramId] = useState('');

  // Update Program List Modal State
  const [isUpdateProgramsModalOpen, setIsUpdateProgramsModalOpen] = useState(false);
  const [updatingCohort, setUpdatingCohort] = useState<Cohort | null>(null);
  const [updatingProgramIds, setUpdatingProgramIds] = useState<string[]>([]);
  const [programSearch, setProgramSearch] = useState('');


  const hasActiveCohort = cohorts.some(c => c.status === 'active');

  const fetchInstructors = async () => {
    try {
      const res = await usersApi.list({ role: 'instructor', limit: 100 }) as any;
      if (res && res.users) {
        setInstructorsList(res.users);
      }
    } catch (err) {
      console.error("Failed to load instructors", err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch programs for select list
      const progList = await programsApi.list() as any[];
      if (progList) {
        setPrograms(progList.map(p => ({ id: p.id, name: p.name })));
      }

      // Fetch all cohorts directly
      const cohortList = await programsApi.listAllCohorts() as any[];
      if (cohortList) {
        const mappedCohorts: Cohort[] = cohortList.map((c) => {
          const primaryProg = c.programs || { id: c.program_id, name: '' };
          const cohortPrograms = c.metadata?.programs || [primaryProg];

          return {
            id: c.id,
            name: c.name,
            programName: cohortPrograms.map((p: any) => p.name).filter(Boolean).join(', '),
            programId: c.program_id || primaryProg.id,
            programsList: cohortPrograms,
            start: new Date(c.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            end: new Date(c.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            students: c.students_count ?? 0,
            instructors: c.instructors_count ?? 0,
            progress: c.progress ?? 0,
            status: c.status || 'upcoming',
            metadata: c.metadata || {},
          };
        });
        setCohorts(mappedCohorts);
      }
    } catch (err) {
      console.error("Failed to load cohort/program data:", err);
      setCohorts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchInstructors();
  }, []);


  const handleSetStatus = async (cohort: Cohort, newStatus: 'active' | 'upcoming' | 'completed') => {
    try {
      await programsApi.updateCohort(cohort.programId, cohort.id, {
        status: newStatus
      });
      // Bust the public cohort cache so students see updated status immediately
      await programsApi.flushCohortCache().catch(() => {});
      loadData();
      if (refreshCohorts) {
        await refreshCohorts();
      }
    } catch (err: any) {
      alert(err.error || err.message || 'Failed to update cohort status');
    }
  };

  const handleDeleteCohort = async (cohort: Cohort) => {
    if (!window.confirm(`Are you sure you want to delete cohort "${cohort.name}"?`)) return;
    try {
      await programsApi.deleteCohort(cohort.programId, cohort.id);
      loadData();
      if (refreshCohorts) {
        await refreshCohorts();
      }
    } catch (err: any) {
      alert(err.error || err.message || 'Failed to delete cohort');
    }
  };

  const handleCreateCohort = async () => {
    setError(null);
    if (!cohortName.trim()) {
      setError('Cohort name is required.');
      return;
    }
    if (selectedProgramIds.length === 0) {
      setError('Please select at least one program module.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and End dates are required.');
      return;
    }
    try {
      const primaryProgramId = selectedProgramIds[0];
      const selectedProgs = programs.filter(p => selectedProgramIds.includes(p.id));
      const cohortPayload: Record<string, unknown> = {
        name: cohortName,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: cohortStatus,
        metadata: { programs: selectedProgs },
      };
      if (registrationCloseDate) {
        cohortPayload.registration_close_date = new Date(registrationCloseDate).toISOString();
      }
      await programsApi.createCohort(primaryProgramId, cohortPayload);
      // Bust the public cohort cache so students see the new cohort immediately
      await programsApi.flushCohortCache().catch(() => {});
      setIsModalOpen(false);
      setCohortName('');
      setSelectedProgramIds([]);
      setStartDate('');
      setEndDate('');
      setRegistrationCloseDate('');
      setCohortStatus('upcoming');

      loadData();
      if (refreshCohorts) {
        await refreshCohorts();
      }
    } catch (err: any) {
      console.error("Failed to create cohort:", err);
      setError(err.error || err.message || 'Failed to create cohort');
    }
  };

  const handleAssignInstructor = async () => {
    if (!assigningCohort || !selectedInstructorId || !selectedAssignProgramId) {
      alert('Please select both a program and an instructor.');
      return;
    }
    try {
      // Use selectedAssignProgramId as the route :id param since that's
      // the specific program we're assigning the instructor to
      await programsApi.assignInstructor(
        selectedAssignProgramId,
        assigningCohort.id,
        selectedInstructorId,
        selectedAssignProgramId
      );
      alert('Instructor assigned successfully!');
      setIsAssignModalOpen(false);
      setSelectedInstructorId('');
      setSelectedAssignProgramId('');
      loadData();
      if (refreshCohorts) {
        await refreshCohorts();
      }
    } catch (err: any) {
      alert(err.error || err.message || 'Failed to assign instructor');
    }
  };

  const handleUpdateProgramList = async () => {
    if (!updatingCohort) return;
    if (updatingProgramIds.length === 0) {
      alert('Please select at least one program.');
      return;
    }
    try {
      const selectedProgs = programs.filter(p => updatingProgramIds.includes(p.id));
      const newMetadata = {
        ...(updatingCohort.metadata || {}),
        programs: selectedProgs
      };
      await programsApi.updateCohort(updatingCohort.programId, updatingCohort.id, {
        metadata: newMetadata
      });
      // Bust the public cohort cache so students see updated programs immediately
      await programsApi.flushCohortCache().catch(() => {});
      alert('Program list updated successfully!');
      setIsUpdateProgramsModalOpen(false);
      loadData();
      if (refreshCohorts) {
        await refreshCohorts();
      }
    } catch (err: any) {
      alert(err.error || err.message || 'Failed to update program list');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cohorts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and organize student groups and batches.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Create Cohort
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input 
            type="text" 
            placeholder="Search cohorts..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors shrink-0">
          <Filter size={16} /> Filter
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading cohorts...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="glass-card rounded-3xl p-6 flex flex-col group hover:border-primary/40 transition-colors relative">
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  cohort.status === 'active' 
                    ? 'bg-green-500/10 text-green-500' 
                    : cohort.status === 'completed'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-orange-500/10 text-orange-500'
                }`}>
                  {cohort.status ? cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1) : 'Upcoming'}
                </span>
              </div>
              
              <div className="relative z-10 flex-1">
                <h3 className="text-xl font-bold">{cohort.name}</h3>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar size={12}/> Start Date</p>
                    <p className="text-sm font-medium">{cohort.start}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar size={12}/> End Date</p>
                    <p className="text-sm font-medium">{cohort.end}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground font-medium">Progress</span>
                    <span className="font-bold text-accent">{cohort.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${cohort.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} className="text-muted-foreground"/> 
                      <span className="font-semibold">{cohort.students}</span> <span className="text-muted-foreground text-xs">Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap size={16} className="text-muted-foreground"/> 
                      <span className="font-semibold">{cohort.instructors}</span> <span className="text-muted-foreground text-xs">Instructors</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCohort(cohort);
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Cohort"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {cohort.status === 'active' ? (
                    <button
                      onClick={() => handleSetStatus(cohort, 'completed')}
                      className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                    >
                      <CheckCircle size={15} />
                      Complete
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (!hasActiveCohort) handleSetStatus(cohort, 'active'); }}
                      disabled={hasActiveCohort}
                      title={hasActiveCohort ? 'Another cohort is already active' : ''}
                      className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Play size={15} />
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setAssigningCohort(cohort);
                      setSelectedInstructorId('');
                      setSelectedAssignProgramId('');
                      setIsAssignModalOpen(true);
                    }}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <UserPlus size={15} />
                    Instructors
                  </button>
                  <button
                    onClick={() => {
                      setUpdatingCohort(cohort);
                      setUpdatingProgramIds((cohort.programsList || []).map((p: any) => p.id));
                      setProgramSearch('');
                      setIsUpdateProgramsModalOpen(true);
                    }}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold bg-secondary/60 text-foreground hover:bg-secondary transition-colors"
                  >
                    <BookOpen size={15} />
                    Programs
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl my-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Create Cohort</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Cohort Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                      placeholder="e.g. Cohort A 2026" 
                      value={cohortName}
                      onChange={e => setCohortName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Programs Available in Cohort</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-xl p-3 bg-background">
                      {programs.map(p => {
                        const isChecked = selectedProgramIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 text-sm font-medium cursor-pointer text-foreground">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                  if (isChecked) {
                                    setSelectedProgramIds(prev => prev.filter(id => id !== p.id));
                                  } else {
                                    setSelectedProgramIds(prev => [...prev, p.id]);
                                  }
                              }}
                              className="rounded border-border text-primary focus:ring-primary/50"
                            />
                            {p.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Registration Close Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                      value={registrationCloseDate}
                      onChange={e => setRegistrationCloseDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">After this date, students will see a &quot;Registration Closed&quot; message on the onboarding page.</p>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                    <select 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      value={cohortStatus}
                      onChange={e => setCohortStatus(e.target.value as 'upcoming' | 'active')}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active" disabled={hasActiveCohort}>Active {hasActiveCohort ? '(Another cohort is active)' : ''}</option>
                    </select>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateCohort}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Create Cohort
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isAssignModalOpen && assigningCohort && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl my-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Assign Instructors</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{assigningCohort.name}</p>
                  </div>
                  <button onClick={() => setIsAssignModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Current Assignments List */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Current Assignments</h4>
                    {(() => {
                      const list = assigningCohort.metadata?.instructor_assignments || [];
                      if (list.length === 0) {
                        return <p className="text-xs text-muted-foreground italic bg-secondary/20 p-3 rounded-xl border border-border">No instructors assigned yet.</p>;
                      }
                      return (
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-border rounded-xl p-2.5 bg-background">
                          {list.map((a: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-secondary/35 px-3 py-2 rounded-lg text-xs">
                              <span className="font-medium text-foreground">{a.instructor_name}</span>
                              <span className="text-muted-foreground font-semibold uppercase tracking-wider">{a.program_name}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Assignment Form */}
                  <div className="space-y-4 border-t border-border pt-4">
                    <h4 className="text-sm font-semibold text-foreground">New Assignment</h4>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Program Module</label>
                      <select 
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                        value={selectedAssignProgramId}
                        onChange={e => setSelectedAssignProgramId(e.target.value)}
                      >
                        <option value="">-- Choose Cohort Program --</option>
                        {(assigningCohort.programsList || []).map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Instructor</label>
                      <select 
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                        value={selectedInstructorId}
                        onChange={e => setSelectedInstructorId(e.target.value)}
                      >
                        <option value="">-- Choose Instructor --</option>
                        {instructorsList
                          .filter((inst: any) => inst.status === 'active')
                          .map((inst: any) => (
                            <option key={inst.id} value={inst.id}>{inst.full_name} ({inst.email})</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                    <button onClick={() => setIsAssignModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                      Close
                    </button>
                    <button 
                      onClick={handleAssignInstructor}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Assign Instructor
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isUpdateProgramsModalOpen && updatingCohort && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsUpdateProgramsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl my-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Update Program List</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{updatingCohort.name}</p>
                  </div>
                  <button onClick={() => setIsUpdateProgramsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <Search size={14} className="text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search programs..."
                      className="bg-transparent border-none outline-none text-sm w-full"
                      value={programSearch}
                      onChange={e => setProgramSearch(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-muted-foreground">Select Cohort Programs</label>
                      <span className="text-xs text-muted-foreground">{updatingProgramIds.length} selected</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-xl p-3 bg-background">
                      {programs
                        .filter(p => p.name.toLowerCase().includes(programSearch.toLowerCase()))
                        .map(p => {
                          const isChecked = updatingProgramIds.includes(p.id);
                          const isCohortProgram = (updatingCohort.programsList || []).some((cp: any) => cp.id === p.id);
                          return (
                            <label key={p.id} className="flex items-center gap-3 text-sm cursor-pointer text-foreground py-1.5 px-1 rounded-lg hover:bg-secondary/40 transition-colors">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setUpdatingProgramIds(prev => prev.filter(id => id !== p.id));
                                  } else {
                                    setUpdatingProgramIds(prev => [...prev, p.id]);
                                  }
                                }}
                                className="rounded border-border text-primary focus:ring-primary/50 w-4 h-4 shrink-0"
                              />
                              <span className="flex-1 font-medium">{p.name}</span>
                              {isCohortProgram && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Active</span>
                              )}
                            </label>
                          );
                        })}
                      {programs.filter(p => p.name.toLowerCase().includes(programSearch.toLowerCase())).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No programs match your search.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-2">
                    <button onClick={() => setIsUpdateProgramsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProgramList}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

      </AnimatePresence>
    </div>
  );
}
