import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Plus, MoreVertical,
  Users, Mail, RefreshCw, UserSquare2, X, Loader2,
  Sparkles
} from 'lucide-react';
import { usersApi, authApi } from '../../lib/api';
import type { AuthUser } from '../../lib/api';

interface InstructorRow extends AuthUser {
  instructor_profiles?: {
    specialization?: string;
    class_assigned?: string;
    skills?: string | string[];
  };
}

// ── Helper: derive specialization from a comma-separated skills string ──────
function deriveSpecialization(skills: string): string {
  const parts = skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  // Use the first skill as the main specialization
  return parts[0];
}

// ── Helper: normalise skills to an array ────────────────────────────────────
function parseSkills(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  // Add Instructor Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Dropdown options menu state
  const [activeMenuInstructorId, setActiveMenuInstructorId] = useState<string | null>(null);

  // Derived specialization (live, from skills field)
  const derivedSpecialization = deriveSpecialization(skillsInput);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuInstructorId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleToggleStatus = async (instructor: InstructorRow) => {
    try {
      const newStatus = instructor.status === 'active' ? 'suspended' : 'active';
      await usersApi.updateStatus(instructor.id, newStatus);
      alert(`Instructor account is now ${newStatus}!`);
      load();
    } catch (err: any) {
      alert(err.error || err.message || 'Failed to update instructor status');
    }
  };

  const handleDeleteInstructor = async (instructor: InstructorRow) => {
    if (!window.confirm(`Are you sure you want to permanently delete instructor "${instructor.full_name}"?`)) return;
    try {
      await usersApi.delete(instructor.id);
      alert('Instructor account deleted successfully!');
      load();
    } catch (err: any) {
      alert(err.error || err.message || 'Failed to delete instructor');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await usersApi.list({ 
        role: 'instructor', 
        page, 
        limit, 
        search: search || undefined
      }) as any;
      setInstructors(res.users || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      const msg = e?.error || e?.message || 'Failed to load instructors. Please try refreshing.';
      setLoadError(msg);
      setInstructors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const resetModal = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setSkillsInput('');
    setError(null);
  };

  const handleAddInstructorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    if (skillsInput.trim() && skillsInput.length > 100) {
      setError('Skills must not exceed 100 characters.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the instructor account
      const res = await authApi.signUp({
        email,
        full_name: fullName,
        password,
        role: 'instructor'
      });

      // 2. If skills were provided, save them + derived specialization to the instructor profile
      if (skillsInput.trim()) {
        const skillsArray = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
        const spec = deriveSpecialization(skillsInput);
        try {
          await usersApi.updateInstructorProfile(res.user.id, {
            skills: skillsArray,
            specialization: spec || undefined,
          });
        } catch (profileErr) {
          // Profile save failed — not fatal, account was created
          console.warn('Could not save instructor profile:', profileErr);
        }
      }

      setIsModalOpen(false);
      resetModal();
      load();
    } catch (err: any) {
      console.error('Failed to add instructor:', err);
      setError(err.error || err.message || 'Failed to add instructor');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Instructors Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total > 0 ? `${total} instructor${total !== 1 ? 's' : ''} on the platform` : 'No instructors yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
          >
            <Plus size={16} /> Add Instructor
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search instructors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors shrink-0">
            <Filter size={16} /> Filter
          </button>
        </div>

        {loadError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-4 rounded-xl flex items-start gap-3">
            <span className="font-bold shrink-0">⚠️ Error:</span>
            <span>{loadError}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading instructors…</p>
          </div>
        ) : instructors.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <UserSquare2 size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">No instructors found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search ? 'Try a different search term.' : 'Instructors will appear here once they are added to the platform.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-xl rounded-bl-xl">Profile</th>
                    <th className="px-4 py-3 font-medium">Specialization</th>
                    <th className="px-4 py-3 font-medium">Skills</th>
                    <th className="px-4 py-3 font-medium">Class Assigned</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium rounded-tr-xl rounded-br-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {instructors.map((inst) => {
                    // instructor_profiles may be an object or an array (Supabase returns array for joins)
                    const rawProfile = (inst as any).instructor_profiles;
                    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
                    const skills = parseSkills(profile?.skills);
                    return (
                      <tr key={inst.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {inst.avatar_url ? (
                              <img src={inst.avatar_url} alt={inst.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                                {inst.full_name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{inst.full_name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail size={10} /> {inst.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {profile?.specialization ? (
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold">
                              <Sparkles size={10} />
                              {profile.specialization}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {skills.length ? skills.slice(0, 3).map((s: string, i: number) => (
                              <span key={i} className="bg-primary/5 border border-primary/20 text-primary px-2 py-0.5 rounded-md text-xs">{s}</span>
                            )) : <span className="text-muted-foreground text-xs">—</span>}
                            {skills.length > 3 && (
                              <span className="text-muted-foreground text-xs self-center">+{skills.length - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users size={14} /> {profile?.class_assigned ?? '—'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inst.status === 'active' 
                              ? 'bg-green-500/10 text-green-500' 
                              : inst.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-red-500/10 text-red-500'
                          }`}>
                            {inst.status ?? 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuInstructorId(activeMenuInstructorId === inst.id ? null : inst.id);
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {activeMenuInstructorId === inst.id && (
                            <div 
                              className="absolute right-4 mt-1 w-44 border border-border rounded-xl shadow-xl z-50 py-1.5"
                              style={{ backgroundColor: 'var(--card-opaque)', opacity: 1 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuInstructorId(null);
                                  handleToggleStatus(inst);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-secondary/55 text-foreground transition-colors"
                              >
                                {inst.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                              </button>
                              <div className="border-t border-border my-1" />
                              <button
                                onClick={() => {
                                  setActiveMenuInstructorId(null);
                                  handleDeleteInstructor(inst);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-red-500/10 text-red-500 transition-colors"
                              >
                                Delete Account
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} entries</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-40">Prev</button>
                <span className="px-2 font-medium">{page} / {totalPages || 1}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Instructor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-7 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add New Instructor</h3>
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddInstructorSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="e.g. Jane Doe" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="e.g. jane.doe@academy.edu" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="Minimum 8 characters" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {/* Skills field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Skills <span className="text-muted-foreground font-normal">(comma-separated, optional)</span>
                  </label>
                  <span className={`text-xs font-mono ${skillsInput.length > 100 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {skillsInput.length}/100
                  </span>
                </div>
                <textarea
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  placeholder="e.g. JavaScript, React, Node.js, System Design"
                  value={skillsInput}
                  onChange={e => {
                    if (e.target.value.length <= 100) setSkillsInput(e.target.value);
                  }}
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter skills separated by commas. Maximum 100 characters.
                </p>
              </div>

              {/* Auto-derived specialization preview */}
              {derivedSpecialization && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <Sparkles size={14} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Auto-derived specialization</p>
                    <p className="text-sm font-semibold text-primary">{derivedSpecialization}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetModal(); }}
                  className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting || skillsInput.length > 100}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? 'Creating...' : 'Create Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
