import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutletContext } from 'react-router-dom';
import {
  Plus, Search, Filter, Edit,
  Trash2, Archive, BookOpen, Users, GraduationCap, X
} from 'lucide-react';
import { programsApi, coursesApi } from '../../lib/api';

interface Program {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  students?: number;
  instructors?: number;
  cohorts?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  program_id: string;
  programs?: { id: string; name: string };
}

export default function ProgramsPage() {
  const location = useLocation();
  const isCoursesView = location.pathname.includes('/courses');
  const { selectedCohortId } = useOutletContext<{ selectedCohortId: string | null }>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Programs state
  const [programs, setPrograms] = useState<Program[]>([]);
  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);

  // Form State (Programs & Courses)
  const [name, setName] = useState(''); // reused as title for course
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // Course specific form state
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setCoverImage(null);
    setSortOrder('0');
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (isCoursesView) {
      setName(item.title || '');
      setDescription(item.description || '');
      setSelectedProgramId(item.program_id || '');
      setSortOrder(String(item.sort_order || 0));
      setIsActive(item.is_active !== false);
    } else {
      setName(item.name || '');
      setDescription(item.description || '');
      setIsActive(item.is_active !== false);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: 'program' | 'course') => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === 'course') {
        await coursesApi.delete(id);
        fetchCourses();
      } else {
        await programsApi.delete(id);
        fetchPrograms();
      }
    } catch (err: any) {
      alert(err.error || err.message || `Failed to delete ${type}`);
    }
  };

  const handleToggleActive = async (program: Program) => {
    try {
      const formData = new FormData();
      formData.append('is_active', String(!program.is_active));
      await programsApi.update(program.id, formData);
      fetchPrograms();
    } catch (err: any) {
      alert(err.error || err.message || 'Failed to update program status');
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await programsApi.list(selectedCohortId || undefined);
      const raw = res as any[];
      if (raw) {
        const mapped = raw.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          is_active: p.is_active !== false,
          students: p.students ?? 0,
          instructors: p.instructors ?? 0,
          cohorts: p.cohorts ?? 0,
        }));
        setPrograms(mapped);
      }
    } catch (err) {
      console.error("Failed to load programs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await coursesApi.list({ cohort_id: selectedCohortId || undefined });
      setCourses(res || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllForModal = async () => {
    if (isCoursesView) {
      try {
        const res = await programsApi.list();
        const raw = res as any[];
        if (raw && raw.length > 0) {
          setPrograms(raw);
          setSelectedProgramId(raw[0].id);
        }
      } catch (err) {
        console.error("Failed to load modal programs:", err);
      }
    }
  };

  useEffect(() => {
    if (isCoursesView) {
      fetchCourses();
    } else {
      fetchPrograms();
    }
  }, [isCoursesView, selectedCohortId]);

  useEffect(() => {
    if (isModalOpen) {
      fetchAllForModal();
    }
  }, [isModalOpen]);

  const handleSave = async () => {
    setError(null);
    if (isCoursesView) {
      if (!name.trim()) {
        setError('Course title is required.');
        return;
      }
      if (!selectedProgramId) {
        setError('Please select a program module.');
        return;
      }
      try {
        if (editingItem) {
          await coursesApi.update(editingItem.id, {
            program_id: selectedProgramId,
            title: name,
            description,
            sort_order: parseInt(sortOrder) || 0,
            is_active: isActive,
          });
        } else {
          await coursesApi.create({
            program_id: selectedProgramId,
            title: name,
            description,
            sort_order: parseInt(sortOrder) || 0,
          });
        }
        setIsModalOpen(false);
        setEditingItem(null);
        setName('');
        setDescription('');
        setSortOrder('0');
        fetchCourses();
      } catch (err: any) {
        console.error("Failed to save course:", err);
        setError(err.error || err.message || 'Failed to save course');
      }
    } else {
      if (!name.trim()) {
        setError('Program name is required.');
        return;
      }
      try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('is_active', String(isActive));
        if (coverImage) {
          formData.append('cover_image', coverImage);
        }

        if (editingItem) {
          await programsApi.update(editingItem.id, formData);
        } else {
          await programsApi.create(formData);
        }
        setIsModalOpen(false);
        setEditingItem(null);
        setName('');
        setDescription('');
        setCoverImage(null);
        setIsActive(true);
        fetchPrograms();
      } catch (err: any) {
        console.error("Failed to save program:", err);
        setError(err.error || err.message || 'Failed to save program');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isCoursesView ? 'Courses' : 'Programs'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isCoursesView
              ? 'Manage courses belonging to program modules for the selected cohort.'
              : 'Manage all learning programs in the academy.'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Create {isCoursesView ? 'Course' : 'Program'}
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={isCoursesView ? "Search courses..." : "Search programs..."}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors shrink-0">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              Loading {isCoursesView ? 'courses' : 'programs'}...
            </div>
          ) : isCoursesView ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Course Title</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No courses found for this cohort/program.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <span className="font-semibold block">{course.title}</span>
                            {course.description && <span className="text-xs text-muted-foreground block line-clamp-1">{course.description}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground font-medium">
                        {course.programs?.name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${course.is_active !== false
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-orange-500/10 text-orange-500'
                          }`}>
                          {course.is_active !== false ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(course)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(course.id, 'course')}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Program Name</th>
                  <th className="px-4 py-3 font-medium">Students</th>
                  <th className="px-4 py-3 font-medium">Instructors</th>
                  <th className="px-4 py-3 font-medium">Cohorts</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No programs found.
                    </td>
                  </tr>
                ) : (
                  programs.map((program) => (
                    <tr key={program.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <span className="font-semibold block">{program.name}</span>
                            {program.description && <span className="text-xs text-muted-foreground block line-clamp-1">{program.description}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users size={14} /> {program.students}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users size={14} /> {program.instructors}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap size={14} /> {program.cohorts}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${program.is_active
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-orange-500/10 text-orange-500'
                          }`}>
                          {program.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(program)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(program)}
                            title={program.is_active ? "Set to Draft" : "Set to Active"}
                            className="p-2 rounded-lg text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                          >
                            <Archive size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(program.id, 'program')}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
          <span>Showing 1 to {isCoursesView ? courses.length : programs.length} of {isCoursesView ? courses.length : programs.length} entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  <h3 className="text-xl font-bold">{editingItem ? 'Edit' : 'Create'} {isCoursesView ? 'Course' : 'Program'}</h3>
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
                  {isCoursesView && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Select Program Module</label>
                      <select
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                        value={selectedProgramId}
                        onChange={e => setSelectedProgramId(e.target.value)}
                      >
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {isCoursesView ? 'Course Title' : 'Program Name'}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder={isCoursesView ? "e.g. Introduction to React" : "e.g. Full Stack Engineering"}
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      placeholder="Brief description..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {!isCoursesView ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Program Cover Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          onChange={e => setCoverImage(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                        <select
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                          value={isActive ? 'active' : 'draft'}
                          onChange={e => setIsActive(e.target.value === 'active')}
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                        <select
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                          value={isActive ? 'active' : 'draft'}
                          onChange={e => setIsActive(e.target.value === 'active')}
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                    >
                      Save {isCoursesView ? 'Course' : 'Program'}
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
