import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersRound, Plus, FolderKanban, X, Loader2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { groupsApi, usersApi, programsApi } from '../../lib/api';

interface GroupMember {
  role: string;
  users: { id: string; full_name: string; email: string; avatar_url: string | null };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  cohort_id: string;
  cohorts?: { id: string; name: string };
  group_members?: GroupMember[];
}

interface Assignment {
  cohort_id: string;
  program_id: string;
  cohorts: { id: string; name: string; status: string };
  programs: { id: string; name: string };
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

export default function InstructorGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    selectedStudents: [] as string[],
  });

  // Load instructor assignments (cohorts)
  useEffect(() => {
    const load = async () => {
      try {
        const data = await usersApi.getInstructorAssignments() as Assignment[];
        setAssignments(data || []);
        if (data && data.length > 0) {
          const activeCohort = data.find(a => a.cohorts?.status === 'active') || data[0];
          setSelectedCohortId(activeCohort.cohort_id);
        }
      } catch (err) {
        console.error('Failed to load assignments', err);
      }
    };
    load();
  }, []);

  // Fetch groups for selected cohort
  useEffect(() => {
    if (!selectedCohortId) return;
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const data = await groupsApi.list(selectedCohortId) as Group[];
        setGroups(data || []);
      } catch (err) {
        console.error('Failed to fetch groups', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [selectedCohortId]);

  // Fetch students for selected cohort when modal opens
  useEffect(() => {
    if (!showModal || !selectedCohortId) return;
    const fetchStudents = async () => {
      try {
        const currentAssignment = assignments.find(a => a.cohort_id === selectedCohortId);
        const data = await programsApi.getStudents(selectedCohortId, currentAssignment?.program_id) as any[];
        setStudents((data || []).map((s: any) => ({
          id: s.id || s.student_id,
          full_name: s.full_name || s.users?.full_name || 'Unknown',
          email: s.email || s.users?.email || '',
        })));
      } catch (err) {
        console.error('Failed to fetch students', err);
      }
    };
    fetchStudents();
  }, [showModal, selectedCohortId, assignments]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !selectedCohortId) return;

    setSubmitting(true);
    setError(null);

    try {
      const newGroup = await groupsApi.create({
        cohort_id: selectedCohortId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      }) as Group;

      // Add selected students
      for (const studentId of form.selectedStudents) {
        await groupsApi.addMember(newGroup.id, studentId, 'member');
      }

      // Refresh groups
      const updated = await groupsApi.list(selectedCohortId) as Group[];
      setGroups(updated || []);

      setSuccess(`Group "${form.name}" created successfully!`);
      setShowModal(false);
      setForm({ name: '', description: '', selectedStudents: [] });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.error || 'Failed to create group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStudent = (id: string) => {
    setForm(f => ({
      ...f,
      selectedStudents: f.selectedStudents.includes(id)
        ? f.selectedStudents.filter(s => s !== id)
        : [...f.selectedStudents, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Groups</h1>
          <p className="text-muted-foreground">Organize students into groups for collaborative projects.</p>
        </div>
        <div className="flex items-center gap-3">
          {assignments.length > 1 && (
            <select
              value={selectedCohortId}
              onChange={e => setSelectedCohortId(e.target.value)}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {assignments.map((a, i) => (
                <option key={i} value={a.cohort_id}>
                  {a.cohorts?.name} — {a.programs?.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowModal(true)}
            disabled={!selectedCohortId}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} /> Create Group
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-semibold">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border p-16 text-center">
          <UsersRound size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-bold mb-2">No Groups Yet</h3>
          <p className="text-muted-foreground mb-6">Create your first group to organize students into teams.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} /> Create Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, i) => {
            const members = group.group_members || [];
            const isExpanded = expandedGroup === group.id;
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl border border-border p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <UsersRound size={24} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
                    {members.length} members
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                )}
                {group.cohorts?.name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <FolderKanban size={14} /> {group.cohorts.name}
                  </div>
                )}

                <div className="mt-auto">
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((m, j) => (
                        <div key={j} className="w-8 h-8 rounded-full bg-primary/20 text-primary border-2 border-card flex items-center justify-center text-xs font-bold" title={m.users?.full_name}>
                          {(m.users?.full_name || 'U').charAt(0)}
                        </div>
                      ))}
                      {members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-bold">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide' : 'View'} Members
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-2 border-t border-border pt-4">
                          {members.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">No members yet</p>
                          ) : (
                            members.map((m, j) => (
                              <div key={j} className="flex items-center gap-2 text-sm">
                                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                  {(m.users?.full_name || 'U').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">{m.users?.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{m.role}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create New Group</h2>
                <button
                  onClick={() => { setShowModal(false); setForm({ name: '', description: '', selectedStudents: [] }); }}
                  className="p-2 hover:bg-secondary rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1 block">Group Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Team Alpha"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Briefly describe this group's purpose..."
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <UserPlus size={16} className="text-primary" />
                    Add Students ({form.selectedStudents.length} selected)
                  </label>
                  {students.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                      Loading students...
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                      {students.map(student => (
                        <label
                          key={student.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedStudents.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="accent-primary"
                          />
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {student.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setForm({ name: '', description: '', selectedStudents: [] }); }}
                    className="flex-1 py-2.5 bg-secondary text-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !form.name.trim()}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    {submitting ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
