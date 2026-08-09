import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  UsersRound, MessageSquare
} from 'lucide-react';
import { groupsApi } from '../../lib/api';

export default function GroupsPage() {
  const { selectedCohortId, cohorts } = useOutletContext<{ selectedCohortId: string | null; cohorts: any[] }>();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await groupsApi.list(selectedCohortId || undefined) as any;
      setGroups(res || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [selectedCohortId]);


  const activeCohort = cohorts?.find(c => c.id === selectedCohortId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Group Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Organize students into groups with assigned programs and members.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No groups found.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const programName = group.cohorts?.programs?.name || group.program_name || 'General Program';
            const cohortName = group.cohorts?.name || activeCohort?.name || 'Academy Cohort';

            return (
              <div key={group.id} className="glass-card rounded-2xl p-5 relative group border border-border hover:border-primary/40 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <UsersRound size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate">{group.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {programName}
                        </span>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                          {cohortName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {group.description && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm bg-secondary/30 p-2.5 rounded-lg border border-border text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Members ({group.group_members?.length || 0})
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {group.group_members && group.group_members.length > 0 ? (
                        group.group_members.map((member: any, idx: number) => {
                          const student = member.users || member.student || {};
                          return (
                            <div key={idx} className="flex items-center justify-between text-sm bg-card border border-border rounded-xl p-2.5">
                              <div className="flex items-center gap-2.5">
                                {student.avatar_url ? (
                                  <img src={student.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                    {(student.full_name || 'M')[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-semibold leading-tight">{student.full_name || 'Member'}</p>
                                  {student.email && (
                                    <p className="text-[10px] text-muted-foreground">{student.email}</p>
                                  )}
                                </div>
                              </div>
                              {member.role === 'lead' || member.role === 'leader' ? (
                                <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">LEAD</span>
                              ) : (
                                <span className="text-[9px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">MEMBER</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground italic bg-secondary/20 p-2.5 rounded-lg border border-dashed border-border text-center">
                          No members assigned yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-md">Active</span>
                  <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium">
                    <MessageSquare size={14}/> Message Group
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
